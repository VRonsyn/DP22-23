import {
  ClientError,
  InvalidReferenceError,
  NotUniqueError,
  RequestTypeError,
} from "./errors";
import { Request, Response } from "express";
import { Status } from "./consts";
import { z } from "zod";
import { Hateoas } from "../types/express/hateoas";
import { logger } from "./logger";

export async function checkReferenceExists(
  checker: (identifier: string) => Promise<boolean>,
  identifier: string,
  referenceName: string
): Promise<void> {
  let exec;
  try {
    exec = await checker(identifier);
  } catch (e: unknown) {
    exec = false;
  }
  if (!exec) {
    throw new InvalidReferenceError(referenceName, identifier);
  }
}

export async function checkUniqueness<Q>(
  checker: (identifier: string) => Promise<boolean>,
  object: Q,
  uniqueFieldName: keyof Q
): Promise<void> {
  if (await checker(String(object[uniqueFieldName]))) {
    throw new NotUniqueError(
      String(uniqueFieldName),
      String(object[uniqueFieldName])
    );
  }
}

export async function validate<ParsedType, PrismaCreateType>(
  body: ParsedType,
  conf: {
    createConverter: (parsedBody: ParsedType) => PrismaCreateType;
    referenceCheckers?: {
      checker: (identifier: string) => Promise<unknown>;
      identifier: keyof ParsedType;
    }[];
    uniquenessChecker?: {
      checker: (identifier: string) => Promise<unknown>;
      identifier: keyof ParsedType;
    }[];
  }
): Promise<{ parsedBody: ParsedType; createObject: PrismaCreateType }> {
  const createObject: PrismaCreateType = conf.createConverter(body);
  await Promise.all(
    (conf.referenceCheckers || []).map(async (checker) => {
      await checkReferenceExists(
        async (id) => Boolean(await checker.checker(id)),
        String(body[checker.identifier]),
        String(checker.identifier)
      );
    })
  );
  await Promise.all(
    (conf.uniquenessChecker || []).map(async (checker) => {
      await checkUniqueness(
        async (id) => Boolean(await checker.checker(id)),
        body,
        checker.identifier
      );
    })
  );
  return { parsedBody: body, createObject };
}

/**
 * Function should be used in every middleware call and makes sure async errors still get handled.
 * @param schemas Schemas that should be used to validate the request
 * @param callback Function that should be called as middleware
 */
export const makeSchemaEndpoint =
  <TParams extends object, TQuery extends object, TBody extends object>(
    schemas: {
      params?: z.Schema<TParams>;
      query?: z.Schema<TQuery>;
      body?: z.Schema<TBody>;
    },
    callback: (
      req: Request<TParams, unknown, TBody, TQuery> & {
        headers: {
          authorization: string;
        };
      },
      res: Response
    ) => Promise<void> | void
  ) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (schemas.params) {
        const paramsResult = schemas.params.safeParse(req.params);
        if (!paramsResult.success) {
          throw new RequestTypeError(
            "URLParams",
            `${paramsResult.error}\n${req.params}`
          );
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        req.params = paramsResult.data;
      }

      if (schemas.query) {
        const queryParamsResult = schemas.query.safeParse(req.query);
        if (!queryParamsResult.success) {
          throw new RequestTypeError(
            "QueryParams",
            `${queryParamsResult.error}\n${req.query}`
          );
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        req.query = queryParamsResult.data;
      }

      if (schemas.body) {
        const bodyResult = schemas.body.safeParse(req.body);
        if (!bodyResult.success) {
          throw new RequestTypeError(
            "Body",
            `${bodyResult.error}\n${req.body}`
          );
        } else if (!Object.keys(bodyResult.data).length) {
          throw new RequestTypeError("Body", "Body is empty");
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        req.body = bodyResult.data;
      }
      await callback(
        req as Request<TParams, unknown, TBody, TQuery> & {
          headers: {
            authorization: string;
          };
        },
        res
      );
    } catch (error: unknown) {
      logger.error(error);
      if (error instanceof ClientError) {
        res.status(error.status).send(error.message);
      } else {
        res.status(Status.internalServerError).send("Internal Server Error");
      }
    }
  };

export function basicRespond<
  Q,
  R extends Record<string, unknown>,
  T extends Hateoas<Q, R>
>(res: Response, status: Status, hateoas: T): void {
  res.status(status).json(hateoas.toJSON());
}
