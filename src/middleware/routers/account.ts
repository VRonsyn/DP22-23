import express, { Router, Router as router } from "express";
import {
  ConflictError,
  InvalidParameterError,
  NotFoundError,
} from "../../util/errors";
import {
  authorizeWithAuth0Id,
  getUserAuth0Id,
} from "../../util/authentication";
import prisma from "../../database";
import { Prefix, Status } from "../../util/consts";
import { Guardian, GuardianPermission, Prisma } from "@prisma/client";
import { basicRespond, makeSchemaEndpoint } from "../../util/express";
import { toIdUrl } from "../../util/serialization";
import { z } from "zod";
import {
  GuardianHateoas,
  guardianPostSchema,
} from "../../types/express/account";
import { asPrismaGuardian } from "../../types/prisma/account";

export const accountRouter: Router = router();
// Set json middleware
accountRouter.use(express.json({ type: ["application/json"] }));

/**
 * Create a guardian
 * @param guardian the guardian to create
 */
async function createGuardian(
  guardian: Prisma.GuardianUncheckedCreateInput
): Promise<Guardian> {
  return prisma.guardian.create({
    data: {
      name: guardian.name,
      auth0Id: guardian.auth0Id,
    },
  });
}

async function findGuardianFromParams(accountId: string): Promise<Guardian> {
  const guardian = await prisma.guardian.findUnique({
    where: {
      id: accountId,
    },
  });
  if (!guardian) {
    throw new InvalidParameterError("accountId", accountId);
  }
  return guardian;
}

/**
 * Get the guardian from which the authorization token was issued
 * @returns the guardian
 * @throws NotFoundError if the guardian does not exist
 * @param authId the auth0Id of the guardian
 */
export async function getGuardianFromAuthId(authId: string): Promise<Guardian> {
  const guardian = await prisma.guardian.findUnique({
    where: {
      auth0Id: authId,
    },
  });
  if (!guardian) {
    throw new NotFoundError("Account does not exist");
  }
  return guardian;
}

/**
 * @api {get} /account Get own account
 * @apiDescription Get the account from which the authorization token was issued
 * @apiName GetAllAccounts
 * @apiGroup Account
 * @apiUse NotFoundError
 */
accountRouter.get(
  `${Prefix.account}/`,
  makeSchemaEndpoint({}, async (req, res) => {
    const guardian = await getGuardianFromAuthId(
      getUserAuth0Id(req.headers.authorization)
    );
    res.redirect(toIdUrl(guardian.id, Prefix.account));
  })
);

/**
 * @api {get} /account/:accountId Get an account
 * @apiDescription Get the account information of the user
 * @apiName GetAccount
 * @apiGroup Account
 * @apiParam {String} accountId The id of the account
 * @apiUse AccountSuccess
 * @apiUse ForbiddenError
 * @apiUse NotFoundError
 * @apiUse RequestTypeError
 */
accountRouter.get(
  `${Prefix.account}/:accountId`,
  makeSchemaEndpoint(
    {
      params: z.object({
        accountId: z.string(),
      }),
    },
    async (req, res) => {
      const guardian = await findGuardianFromParams(req.params.accountId);
      basicRespond(res, Status.ok, new GuardianHateoas(guardian));
    }
  )
);

/**
 * @api {post} /account Create a new account
 * @apiDescription Create an account with the given information and id from authorization token.
 * @apiName PostAccount
 * @apiGroup Account
 * @apiUse AccountPostBody
 * @apiUse AccountSuccess
 * @apiUse ConflictError
 * @apiUse RequestTypeError
 */
accountRouter.post(
  `${Prefix.account}/`,
  makeSchemaEndpoint(
    {
      body: guardianPostSchema,
    },
    async (req, res) => {
      if (
        await prisma.guardian.findUnique({
          where: {
            auth0Id: req.headers.authorization,
          },
        })
      ) {
        throw new ConflictError("Account already exists");
      }
      const requestGuardian = asPrismaGuardian(
        req.body,
        getUserAuth0Id(req.headers.authorization)
      );
      const created = await createGuardian(requestGuardian);
      basicRespond(res, Status.created, new GuardianHateoas(created));
    }
  )
);

/**
 * @api {delete} /account/:accountId Delete an account
 * @apiDescription Delete the account with the given id. The account must not have any children.
 * @apiName DeleteAccount
 * @apiGroup Account
 * @apiParam {String} accountId The id of the account
 * @apiSuccess 204 No content
 * @apiUse ForbiddenError
 * @apiUse RequestTypeError
 * @apiUse ConflictError
 */
accountRouter.delete(
  `${Prefix.account}/:accountId`,
  makeSchemaEndpoint(
    {
      params: z.object({
        accountId: z.string(),
      }),
    },
    async (req, res) => {
      const guardian = await findGuardianFromParams(req.params.accountId);
      authorizeWithAuth0Id(req.headers.authorization, guardian.auth0Id);
      const childAccessRelations = await prisma.childAccessRelation.findMany({
        where: {
          guardian: guardian,
          permission: GuardianPermission.ADMIN,
        },
      });

      if (childAccessRelations.length) {
        throw new ConflictError(
          "Account contains children and cannot be deleted"
        );
      } else {
        await prisma.guardian.delete({
          where: {
            auth0Id: guardian.auth0Id,
          },
        });
        res.status(Status.noContent).send();
      }
    }
  )
);
