import { z } from "zod";
import { Prefix, Status } from "../../../util/consts";
import { basicRespond, makeSchemaEndpoint } from "../../../util/express";
import prisma from "../../../database";
import { InvalidParameterError, NotFoundError } from "../../../util/errors";
import {
  TaskProgressHateaos,
  taskProgressPatchSchema,
} from "../../../types/express/activity";
import express, { Router as router, Router } from "express";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import { UrlBuilder } from "../../../util/urlBuilder";
import { authorizeAtLeastGuardian } from "../../../util/authentication";
import { TaskProgress } from "@prisma/client";
import { findActivityFromParams } from "./Activity";
import { asPrismaTaskProgressPatch } from "../../../types/prisma/activity";

export async function findTaskProgressFromParams(
  activityId: string,
  taskId: string
): Promise<TaskProgress> {
  const taskProgress = await prisma.taskProgress.findUnique({
    where: { activityTask: { activityId, taskId } },
  });
  if (!taskProgress) {
    throw new InvalidParameterError("taskId", taskProgress);
  }
  return taskProgress;
}

export const taskProgressRouter: Router = router();
// Set json middleware
taskProgressRouter.use(express.json({ type: ["application/json"] }));

/**
 * @apiDefine AllTaskProgressParams
 * @apiParam {String} childId The id of the child
 * @apiParam {String} activityId The id of the activity
 * @apiParam {String} taskId The id of the task
 */
const allTaskProgressParamSchema = z.object({
  childId: z.string().uuid(),
  activityId: z.string().uuid(),
});

/**
 * @apiDefine OneTaskProgressParams
 * @apiParam {String} childId The id of the child
 * @apiParam {String} activityId The id of the activity
 * @apiParam {String} taskId The id of the task
 */
const oneTaskProgressParamSchema = allTaskProgressParamSchema.extend({
  taskId: z.string().uuid(),
});

taskProgressRouter
  .route(`${Prefix.taskProgress}/`)
  /**
   * @api {get} /children/:childId/activity/:activityId/progresses Get all task progress of activity
   * @apiName GetAllTaskProgress
   * @apiGroup Progress
   * @apiUse AllTaskProgressParams
   * @apiSuccess ReferenceHateoas
   */
  .get(
    makeSchemaEndpoint(
      {
        params: allTaskProgressParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const taskProgress = await prisma.taskProgress.findMany({
          where: {
            activityId: req.params.activityId,
          },
        });
        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            taskProgress.map((taskProgress) => {
              return new UrlBuilder()
                .addPrefix(Prefix.taskProgress, {
                  childId: req.params.childId,
                  activityId: taskProgress.activityId,
                })
                .addId(taskProgress.taskId)
                .toCompleteAPIPath();
            }),
            {
              self: new UrlBuilder()
                .addPrefix(Prefix.taskProgress, req.params)
                .toCompleteAPIPath(),
            }
          )
        );
      }
    )
  );

taskProgressRouter
  .route(`${Prefix.taskProgress}/:taskId`)
  /**
   * @api {get} /children/:childId/activity/:activityId/progresses/:taskId Get progress of a task
   * @apiName GetTask
   * @apiGroup Progress
   * @apiUse OneTaskProgressParams
   * @apiUse TaskProgressSuccess
   * @apiUse ForbiddenError
   * @apiUse NotFoundError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: oneTaskProgressParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const [progress, activity] = await Promise.all([
          findTaskProgressFromParams(req.params.activityId, req.params.taskId),
          findActivityFromParams(req.params.activityId, req.params.childId),
        ]);

        basicRespond(
          res,
          Status.ok,
          new TaskProgressHateaos(
            progress,
            req.params.childId,
            activity.templateId
          )
        );
      }
    )
  )
  /**
   * @api {patch} /children/:childId/activities/:activityId/tasks/:taskId Update the progress of a task of activity
   * @apiName PatchProgress
   * @apiGroup Progress
   * @apiUse OneTaskProgressParams
   * @apiUse TaskProgressPatchBody
   * @apiUse TaskProgressSuccess
   */
  .patch(
    makeSchemaEndpoint(
      {
        params: oneTaskProgressParamSchema,
        body: taskProgressPatchSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const task = await prisma.task.findUnique({
          where: {
            id: req.params.taskId,
          },
        });
        if (!task) {
          throw new NotFoundError("Task not found");
        }

        const taskProgress = await prisma.taskProgress.update({
          where: {
            activityTask: {
              activityId: req.params.activityId,
              taskId: req.params.taskId,
            },
          },
          data: asPrismaTaskProgressPatch(req.body),
        });
        basicRespond(
          res,
          Status.ok,
          new TaskProgressHateaos(
            taskProgress,
            req.params.childId,
            task.templateId
          )
        );
      }
    )
  );
