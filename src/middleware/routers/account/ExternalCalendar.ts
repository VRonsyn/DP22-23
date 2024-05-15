import { ExternalCalendar } from "@prisma/client";
import express, { Router as router, Router } from "express";
import { z } from "zod";
import prisma from "../../../database";
import {
  ExternalCalendarHateaos,
  externalCalendarPatchSchema,
  externalCalendarPostSchema,
} from "../../../types/express/account";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import { Prefix, Status } from "../../../util/consts";
import { InvalidParameterError } from "../../../util/errors";
import { basicRespond, makeSchemaEndpoint } from "../../../util/express";
import { asPrismaExternalCalendar } from "../../../types/prisma/account";
import { toExternalCalendarIdUrl, toIdUrl } from "../../../util/serialization";

export async function findExternalCalendarFromParams(
  externalCalendarId: string,
  accountId: string
): Promise<ExternalCalendar> {
  const externalCalendar = await prisma.externalCalendar.findUnique({
    where: { id: externalCalendarId },
  });
  if (!externalCalendar) {
    throw new InvalidParameterError("externalCalendarId", externalCalendarId);
  }
  if (externalCalendar.guardianId !== accountId) {
    throw new InvalidParameterError("accountId", accountId);
  }

  return externalCalendar;
}

/**
 * @apiDefine AllExternalCalendarsParams
 * @apiParam {String} accountId The id of the account
 */
const allExternalCalendarsParamSchema = z.object({
  accountId: z.string().uuid(),
});

/**
 * @apiDefine OneExternalCalendarsParams
 * @apiParam {String} accountId The id of the account
 * @apiParam {String} externalCalendarId The id of the externalCalendar
 */
const oneExternalCalendarParamSchema = allExternalCalendarsParamSchema.extend({
  externalCalendarId: z.string().uuid(),
});

export const externalCalendarRouter: Router = router();
// Set json middleware
externalCalendarRouter.use(express.json({ type: ["application/json"] }));

externalCalendarRouter
  .route(`${Prefix.externalCalendar}/`)
  /**
   * @api {get} /account/:accountId/externalCalendars Get all externalCalendars of account
   * @apiName GetExternalCalendars
   * @apiGroup ExternalCalendars
   * @apiUse AllExternalCalendarsParams
   * @apiUse ReferenceHateoas
   * @apiSuccess {Object} _links The links to the account and self
   * @apiSuccess {String} _links.account The URL to the account
   * @apiSuccess {String} _links.self The URL to the externalCalendars
   * @apiUse ForbiddenError
   * @apiUse RequestTypeError
   * @apiUse NotFoundError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: allExternalCalendarsParamSchema,
      },
      async (req, res) => {
        const externalCalendars = await prisma.externalCalendar.findMany({
          where: {
            guardianId: req.params.accountId,
          },
        });

        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            externalCalendars.map((externalCalendar) => {
              return toExternalCalendarIdUrl(
                externalCalendar.guardianId,
                externalCalendar.id
              );
            }),
            {
              self: toExternalCalendarIdUrl(req.params.accountId, ""),
              account: toIdUrl(req.params.accountId, Prefix.account),
            }
          )
        );
      }
    )
  )
  /**
   * @api {post} /account/:accountId/externalCalendars Create an externalCalendar for a account
   * @apiName CreateExternalCalendarForAccount
   * @apiGroup ExternalCalendars
   * @apiUse AllExternalCalendarsParams
   * @apiUse ExternalCalendarPostBody
   * @apiUse ExternalCalendarSuccess
   * @apiUse ForbiddenError
   * @apiUse InvalidReferenceError
   * @apiUse RequestTypeError
   * @apiUse IdUrlParseError
   * @apiUse NotFoundError
   * @apiUse ConflictError
   */
  .post(
    makeSchemaEndpoint(
      {
        params: allExternalCalendarsParamSchema,
        body: externalCalendarPostSchema,
      },
      async (req, res) => {
        const data = asPrismaExternalCalendar(req.body, req.params.accountId);
        const created = await prisma.externalCalendar.create({
          data,
        });

        basicRespond(res, Status.created, new ExternalCalendarHateaos(created));
      }
    )
  );

externalCalendarRouter
  .route(`${Prefix.externalCalendar}/:externalCalendarId`)
  /**
   * @api {get} /account/:accountId/externalCalendars/:externalCalendarId Get an externalCalendar
   * @apiName GetExternalCalendar
   * @apiGroup ExternalCalendars
   * @apiUse OneExternalCalendarsParams
   * @apiUse ExternalCalendarSuccess
   * @apiUse ForbiddenError
   * @apiUse NotFoundError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: oneExternalCalendarParamSchema,
      },
      async (req, res) => {
        const externalCalendar = await findExternalCalendarFromParams(
          req.params.externalCalendarId,
          req.params.accountId
        );

        basicRespond(
          res,
          Status.ok,
          new ExternalCalendarHateaos(externalCalendar)
        );
      }
    )
  )
  /**
   * @api {patch} /account/:accountId/externalCalendars/:externalCalendarId Update an externalCalendar
   * @apiName UpdateExternalCalendar
   * @apiGroup ExternalCalendars
   * @apiUse OneExternalCalendarsParams
   * @apiUse ExternalCalendarPatchBody
   * @apiSuccess ExternalCalendarSuccess
   *
   */
  .patch(
    makeSchemaEndpoint(
      {
        params: oneExternalCalendarParamSchema,
        body: externalCalendarPatchSchema,
      },
      async (req, res) => {
        const externalCalendar = await prisma.externalCalendar.update({
          where: {
            id: req.params.externalCalendarId,
          },
          data: { ...req.body, ...req.params },
        });
        basicRespond(
          res,
          Status.ok,
          new ExternalCalendarHateaos(externalCalendar)
        );
      }
    )
  )
  /**
   * @api {delete} /account/:accountId/externalCalendars/:externalCalendarId Delete an externalCalendar
   * @apiName DeleteExternalCalendar
   * @apiGroup ExternalCalendars
   * @apiUse OneExternalCalendarsParams
   * @apiSuccess (204) NoContent The externalCalendar was deleted
   * @apiUse NotFoundError
   * @apiUse ForbiddenError
   */
  .delete(
    makeSchemaEndpoint(
      {
        params: oneExternalCalendarParamSchema,
      },
      async (req, res) => {
        await prisma.externalCalendar.delete({
          where: {
            id: req.params.externalCalendarId,
          },
        });
        res.status(Status.noContent).send();
      }
    )
  );
