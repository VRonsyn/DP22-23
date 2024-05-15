import { Activity } from "@prisma/client";
import express, { Router as router, Router } from "express";
import { z } from "zod";
import prisma from "../../../database";
import {
  ActivityHateaos,
  activityPatchSchema,
  activityPostSchema,
} from "../../../types/express/activity";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import { authorizeAtLeastGuardian } from "../../../util/authentication";
import { Prefix, Status } from "../../../util/consts";
import { InvalidParameterError } from "../../../util/errors";
import { basicRespond, makeSchemaEndpoint } from "../../../util/express";
import { UrlBuilder } from "../../../util/urlBuilder";
import {
  asPrismaActivity,
  asPrismaActivityPatch,
} from "../../../types/prisma/activity";
import { idURLToTemplateId, recurrenceToDates } from "../../../util/parser";

export async function findActivityFromParams(
  activityId: string,
  childId: string
): Promise<Activity> {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });
  if (!activity) {
    throw new InvalidParameterError("activityId", activityId);
  }
  if (activity.childId !== childId) {
    throw new InvalidParameterError("childId", childId);
  }
  return activity;
}

/**
 * @apiDefine AllActivitiesParams
 * @apiParam {String} childId The id of the child
 */
const allActivitiesParamSchema = z.object({
  childId: z.string().uuid(),
});

/**
 * @apiDefine AllActivitiesQuery
 * @apiParam {DateTime} before The start moment before which the activities should be returned
 * @apiParam {DateTime} after The start moment after which the activities should be returned
 * @apiParam {Number} limit The maximum number of activities to return
 * @apiParam {Number} skip The number of activities to skip
 */
const allActivitiesQuerySchema = z.object({
  before: z.coerce.date().optional(),
  after: z.coerce.date().optional(),
  limit: z.number().optional(),
  skip: z.number().optional(),
});

/**
 * @apiDefine OneActivitiesParams
 * @apiParam {String} childId The id of the child
 * @apiParam {String} activityId The id of the activity
 */
const oneActivityParamSchema = allActivitiesParamSchema.extend({
  activityId: z.string().uuid(),
});

export const activityRouter: Router = router();
// Set json middleware
activityRouter.use(express.json({ type: ["application/json"] }));

activityRouter
  .route(`${Prefix.activity}/`)
  /**
   * @api {get} /children/:childId/activities Get all activities of child
   * @apiName GetActivities
   * @apiGroup Activities
   * @apiUse AllActivitiesParams
   * @apiUse AllActivitiesQuery
   * @apiUse ReferenceHateoas
   * @apiSuccess {Object} _links The links to the child and self
   * @apiSuccess {String} _links.child The URL to the child
   * @apiSuccess {String} _links.self The URL to the activities
   * @apiSuccess {String} _links.child The URL to the child
   * @apiUse ForbiddenError
   * @apiUse RequestTypeError
   * @apiUse NotFoundError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: allActivitiesParamSchema,
        query: allActivitiesQuerySchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const activities = await prisma.activity.findMany({
          where: {
            childId: req.params.childId,
            start: { gte: req.query.after, lte: req.query.before },
          },
          take: req.query.limit,
          skip: req.query.skip,
        });

        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            activities.map((activity) => {
              return new UrlBuilder()
                .addPrefix(Prefix.activity, {
                  childId: req.params.childId,
                })
                .addId(activity.id)
                .toCompleteAPIPath();
            }),
            {
              self: new UrlBuilder()
                .addPrefix(Prefix.activity, {
                  childId: req.params.childId,
                })
                .toCompleteAPIPath(),
            }
          )
        );
      }
    )
  )
  /**
   * @api {post} /children/:childId/activities Create an activity
   * @apiName CreateActivity
   * @apiGroup Activities
   * @apiUse AllActivitiesParams
   * @apiUse ActivityPostBody
   * @apiUse ActivitySuccess
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
        params: allActivitiesParamSchema,
        body: activityPostSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const dates = recurrenceToDates(req.body.recurrence, req.body.start);
        const data = [];

        // Creating an activity also creates a taskProgress for each task in the template
        const tasks = await prisma.task.findMany({
          where: { templateId: idURLToTemplateId(req.body.templateUrl) },
        });

        for (const date of dates) {
          const activity = asPrismaActivity(
            {
              ...req.body,
              start: date,
            },
            req.params.childId
          );

          const created = await prisma.activity.create({
            data: activity,
          });

          // Creating an activity also creates a taskProgress for each task in the template
          await prisma.taskProgress.createMany({
            data: tasks.map((task) => {
              return {
                taskId: task.id,
                activityId: created.id,
              };
            }),
          });

          data.push(created);
        }
        basicRespond(res, Status.created, new ActivityHateaos(data[0]));
      }
    )
  );

activityRouter
  .route(`${Prefix.activity}/:activityId`)
  /**
   * @api {get} /children/:childId/activities/:activityId Get activity
   * @apiName GetActivity
   * @apiGroup Activities
   * @apiUse OneActivitiesParams
   * @apiUse ActivitySuccess
   * @apiUse ForbiddenError
   * @apiUse NotFoundError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: oneActivityParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const activity = await findActivityFromParams(
          req.params.activityId,
          req.params.childId
        );

        basicRespond(res, Status.ok, new ActivityHateaos(activity));
      }
    )
  )
  /**
   * @api {patch} /children/:childId/activities/:activityId Update activity
   * @apiName UpdateActivity
   * @apiGroup Activities
   * @apiUse OneActivitiesParams
   * @apiUse ActivityPatchBody
   * @apiUse ActivitySuccess
   *
   */
  .patch(
    makeSchemaEndpoint(
      {
        params: oneActivityParamSchema,
        body: activityPatchSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const activity = await prisma.activity.update({
          where: {
            id: req.params.activityId,
          },
          data: asPrismaActivityPatch(req.body, req.params.childId),
        });
        basicRespond(res, Status.ok, new ActivityHateaos(activity));
      }
    )
  )
  /**
   * @api {delete} /children/:childId/activities/:activityId Delete an activity
   * @apiName DeleteActivity
   * @apiGroup Activities
   * @apiUse OneActivitiesParams
   * @apiSuccess (204) NoContent The child was deleted
   * @apiUse NotFoundError
   * @apiUse ForbiddenError
   */
  .delete(
    makeSchemaEndpoint(
      {
        params: oneActivityParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        await prisma.activity.delete({
          where: {
            id: req.params.activityId,
          },
        });
        res.status(Status.noContent).send();
      }
    )
  );
