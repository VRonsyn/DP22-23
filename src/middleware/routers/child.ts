import express, { Router as router, Router } from "express";
import {
  BadRequest,
  ForbiddenError,
  InvalidReferenceError,
} from "../../util/errors";
import prisma from "../../database";
import {
  Child,
  ChildAccessRelation,
  Guardian,
  GuardianPermission,
  Prisma,
} from "@prisma/client";
import { Prefix, Status } from "../../util/consts";
import { z } from "zod";
import { basicRespond, makeSchemaEndpoint } from "../../util/express";
import {
  authorizeAdmin,
  authorizeAtLeastGuardian,
  getUserAuth0Id,
} from "../../util/authentication";
import { getGuardianFromAuthId } from "./account";
import { ReferenceHateoas } from "../../types/express/hateoas";
import { toCompleteAPIPath, toIdUrl } from "../../util/serialization";
import {
  ChildHateoas,
  ChildPost,
  childPostSchema,
  ChildWithSettings,
} from "../../types/express/child";
import { idURLToAccountId } from "../../util/parser";
import deepEqual from "deep-equal";
import { UrlBuilder } from "../../util/urlBuilder";

/**
 * @apiDefine QuestionPrefixParams
 */
export const childRouter: Router = router();
// Set json middleware
childRouter.use(express.json({ type: ["application/json"] }));

const queryPermissionTypeSchema = z.object({
  permission: z
    .enum([GuardianPermission.ADMIN, GuardianPermission.GUARDIAN])
    .optional(),
});

/**
 * Create a child
 * @param childPost the child to create
 * @param guardian the guardian that creates the child and will be admin
 */
async function createChild(
  childPost: ChildPost,
  guardian: Guardian
): Promise<ChildWithSettings> {
  let set;
  if (childPost.settings === undefined) {
    set = {};
  } else {
    set = childPost.settings;
  }

  const settings = await prisma.childSettings.create({
    data: set,
  });

  const dbChild = await prisma.child.create({
    data: {
      name: childPost.name,
      settingsId: settings.id,
    },
    include: {
      settings: true,
    },
  });

  await prisma.childAccessRelation.create({
    data: {
      childId: dbChild.id,
      guardianId: guardian.id,
      permission: GuardianPermission.ADMIN,
    },
  });
  return dbChild;
}

/**
 * Remove the guardian permission from the guardian
 * @param child
 * @param guardian
 * @param request
 */
async function removeOwnAccessRelation(
  child: Child,
  guardian: Guardian,
  request: {
    [guardian: string]: GuardianPermission[];
  }
): Promise<void> {
  // Get the current relations, remove the guardian permission from the guardian and check if the request is equal.
  // If the request is equal, the guardian is only removing his own guardian permission.
  // Note: the guardian can't remove his own admin permission, because he is the only one with admin permission.

  const childAccessRelations = await prisma.childAccessRelation.findMany({
    where: {
      childId: child.id,
    },
  });

  const groupedRelations = groupBy(childAccessRelations);

  if (deepEqual(groupedRelations, request)) {
    // Patch is identical to current state
    return;
  }

  // Remove the guardian permission from the guardian
  const guardianUrl = new UrlBuilder()
    .addPrefix(Prefix.account, {})
    .addId(guardian.id)
    .toCompleteAPIPath();

  groupedRelations[guardianUrl] = groupedRelations[guardianUrl].filter(
    (permission) => permission !== GuardianPermission.GUARDIAN
  );

  if (groupedRelations[guardianUrl].length === 0) {
    delete groupedRelations[guardianUrl];
  }

  // request != existing relations - guardian
  if (!deepEqual(request, groupedRelations)) {
    throw new ForbiddenError(
      "You can only remove your own guardian access relation"
    );
  }

  // The request only removes the guardian access relation
  await prisma.childAccessRelation.deleteMany({
    where: {
      childId: child.id,
      guardianId: guardian.id,
      permission: GuardianPermission.GUARDIAN,
    },
  });
}

/**
 * @apiDefine UpdateChildAccessRelations
 * @apiUse BadRequestError
 * @apiUse InvalidReferenceError
 */
async function updateChildAccessRelations(
  child: Child,
  guardians: {
    [guardian: string]: GuardianPermission[];
  }
): Promise<void> {
  // Check if new relations are valid
  let oneAdmin = false;
  for (const guardian in guardians) {
    if (guardians[guardian].includes(GuardianPermission.ADMIN)) {
      if (oneAdmin) {
        throw new BadRequest("Only one guardian can be ADMIN");
      }
      oneAdmin = true;
    }
  }
  if (!oneAdmin) {
    throw new BadRequest("There must be one guardian with ADMIN permission");
  }

  // Replace all relations with the new ones
  await prisma.$transaction(async (prisma) => {
    await prisma.childAccessRelation.deleteMany({
      where: {
        childId: child.id,
      },
    });
    for (const guardian in guardians) {
      for (const permission of guardians[guardian]) {
        try {
          await prisma.childAccessRelation.create({
            data: {
              childId: child.id,
              guardianId: idURLToAccountId(guardian),
              permission: permission,
            },
          });
        } catch (e) {
          if (e instanceof Prisma.PrismaClientKnownRequestError) {
            throw new InvalidReferenceError("Guardian", guardian);
          } else {
            throw e;
          }
        }
      }
    }
  });
}

const groupBy = (xs: ChildAccessRelation[]) => {
  return xs.reduce(
    (rv: { [key: string]: GuardianPermission[] }, x: ChildAccessRelation) => {
      const key = toIdUrl(x.guardianId, Prefix.account);
      (rv[key] = rv[key] || []).push(x.permission);
      return rv;
    },
    {}
  );
};

/**
 * Get all guardians from a child.
 * @param child the child to get the guardians from
 */
async function getGuardiansFromChild(
  child: Child
): Promise<{ [guardian: string]: GuardianPermission[] }> {
  const relations = await prisma.childAccessRelation.findMany({
    where: { childId: child.id },
  });

  return groupBy(relations);
}

/**
 * @api {get} /children Get all children
 * @apiDescription Returns a list of all children where the guardian has access to
 * @apiName GetChildren
 * @apiGroup Children
 * @apiUse ReferenceHateoas
 * @apiUse NotFoundError
 */
childRouter.get(
  `${Prefix.child}/`,
  makeSchemaEndpoint(
    {
      query: queryPermissionTypeSchema,
    },
    async (req, res) => {
      const guardian = await getGuardianFromAuthId(
        getUserAuth0Id(req.headers.authorization)
      );
      const children = await prisma.childAccessRelation.findMany({
        where: { guardianId: guardian.id, permission: req.query.permission },
      });
      basicRespond(
        res,
        Status.ok,
        new ReferenceHateoas(
          children.map((child) => toIdUrl(child.childId, Prefix.child)),
          {
            self: toCompleteAPIPath(Prefix.child),
          }
        )
      );
    }
  )
);

/**
 * @api {get} /children/:childId Get a child
 * @apiDescription Returns a child where the guardian has access to
 * @apiName GetChild
 * @apiGroup Children
 * @apiUse ChildSuccess
 * @apiParam {String} childId The id of the child
 * @apiUse NotFoundError
 */
childRouter.get(
  `${Prefix.child}/:childId`,
  makeSchemaEndpoint(
    {
      params: z.object({
        childId: z.string(),
      }),
    },
    async (req, res) => {
      await authorizeAtLeastGuardian(
        req.headers.authorization,
        req.params.childId
      );
      // Due to authorization, the child is guaranteed to exist
      const child = await prisma.child.findUniqueOrThrow({
        where: { id: req.params.childId },
        include: {
          settings: true,
        },
      });
      const guardians = await getGuardiansFromChild(child);
      basicRespond(res, Status.ok, new ChildHateoas(child, guardians));
    }
  )
);

/**
 * @api {post} /children Create a new child
 * @apiName CreateChild
 * @apiGroup Children
 * @apiDescription Creates a new child
 *
 * @apiUse jsonHeader
 * @apiUse ChildPostBody
 * @apiUse ChildSuccess
 * @apiUse UpdateChildAccessRelations
 */
childRouter.post(
  `${Prefix.child}/`,
  makeSchemaEndpoint(
    {
      body: childPostSchema,
    },
    async (req, res) => {
      const guardian = await getGuardianFromAuthId(
        getUserAuth0Id(req.headers.authorization)
      );
      const child = await createChild(req.body, guardian);

      if (req.body.guardians) {
        await updateChildAccessRelations(child, req.body.guardians);
      }

      const guardians = await getGuardiansFromChild(child);
      basicRespond(res, Status.created, new ChildHateoas(child, guardians));
    }
  )
);

/**
 * @api {delete} /children/:childId Delete a child
 * @apiDescription Deletes a child where the guardian has admin access to
 * @apiName DeleteChild
 * @apiGroup Children
 * @apiParam {String} childId The id of the child
 * @apiSuccess (204) NoContent The child was deleted
 * @apiUse NotFoundError
 * @apiUse ForbiddenError
 */
childRouter.delete(
  `${Prefix.child}/:childId`,
  makeSchemaEndpoint(
    {
      params: z.object({
        childId: z.string(),
      }),
    },
    async (req, res) => {
      await authorizeAdmin(req.headers.authorization, req.params.childId);

      await prisma.$transaction([
        prisma.clarificationImage.deleteMany({
          where: { childId: req.params.childId },
        }),
        prisma.submittedSurvey.deleteMany({
          where: { childId: req.params.childId },
        }), // Cascade delete submittedSurveyAnswer
        prisma.template.deleteMany({
          where: { childId: req.params.childId },
        }),
        prisma.activity.deleteMany({ where: { childId: req.params.childId } }),
        prisma.childAccessRelation.deleteMany({
          where: { childId: req.params.childId },
        }),
        prisma.child.delete({ where: { id: req.params.childId } }),
      ]);

      res.status(Status.noContent).send();
    }
  )
);

/**
 * @api {patch} /children/:childId Edit child
 * @apiDescription Edit a child where the guardian has admin access to
 * @apiName PatchChild
 * @apiGroup Children
 * @apiParam {String} childId The id of the child
 * @apiUse ChildPatchBody
 * @apiUse ChildSuccess
 * @apiUse NotFoundError
 * @apiUse UpdateChildAccessRelations
 */
childRouter.patch(
  `${Prefix.child}/:childId`,
  makeSchemaEndpoint(
    {
      params: z.object({
        childId: z.string(),
      }),
      body: childPostSchema.partial(),
    },
    async (req, res) => {
      // check if the guardian is a guardian/admin of the child
      await authorizeAtLeastGuardian(
        req.headers.authorization,
        req.params.childId
      );

      const tokenId = getUserAuth0Id(req.headers.authorization);

      const childAccessRelations = await prisma.childAccessRelation.findMany({
        where: {
          guardian: {
            auth0Id: tokenId,
          },
          childId: req.params.childId,
        },
      });

      // update the name of the child
      let child = await prisma.child.update({
        where: { id: req.params.childId },
        data: {
          name: req.body.name,
        },
        include: {
          settings: true,
        },
      });

      // update settings of the child
      if (req.body.settings !== undefined) {
        await prisma.childSettings.update({
          where: { id: child.settingsId },
          data: req.body.settings,
        });
      }

      // update the guardians, but check which permission the guardian has
      if (req.body.guardians) {
        if (
          childAccessRelations.some(
            (relation) => relation.permission === GuardianPermission.ADMIN
          )
        ) {
          // if the guardian has admin permission, update all guardians
          await updateChildAccessRelations(child, req.body.guardians);
        } else {
          // if the guardian has guardian permission, he can only remove himself. Otherwise, send a forbidden error
          const guardian = await prisma.guardian.findUniqueOrThrow({
            where: { auth0Id: tokenId },
          });
          await removeOwnAccessRelation(child, guardian, req.body.guardians);
        }
      }

      child = await prisma.child.findUniqueOrThrow({
        where: { id: req.params.childId },
        include: {
          settings: true,
        },
      });

      const guardians = await getGuardiansFromChild(child);
      basicRespond(res, Status.ok, new ChildHateoas(child, guardians));
    }
  )
);
