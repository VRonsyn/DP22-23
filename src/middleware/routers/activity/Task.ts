import { Task } from "@prisma/client";
import express, { Router as router, Router } from "express";
import { z } from "zod";
import prisma from "../../../database";
import {
  TaskHateaos,
  taskPatchSchema,
  taskPostSchema,
} from "../../../types/express/activity";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import { authorizeAtLeastGuardian } from "../../../util/authentication";
import { Prefix, Status } from "../../../util/consts";
import { InvalidParameterError } from "../../../util/errors";
import { basicRespond, makeSchemaEndpoint } from "../../../util/express";
import { UrlBuilder } from "../../../util/urlBuilder";
import {
  asPrismaTask,
  asPrismaTaskPatch,
} from "../../../types/prisma/activity";

export async function findTaskFromParams(taskId: string): Promise<Task> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });
  if (!task) {
    throw new InvalidParameterError("taskId", task);
  }
  return task;
}

/**
 * @apiDefine AllTasksParams
 * @apiParam {String} childId The id of the child
 * @apiParam {String} templateId The id of the template
 */
const allTasksParamSchema = z.object({
  childId: z.string().uuid(),
  templateId: z.string().uuid(),
});

/**
 * @apiDefine OneTaskParams
 * @apiParam {String} childId The id of the child
 * @apiParam {String} templateId The id of the template
 * @apiParam {String} taskId The id of the task
 */
const oneTaskParamSchema = allTasksParamSchema.extend({
  taskId: z.string().uuid(),
});

export const taskRouter: Router = router();
// Set json middleware
taskRouter.use(express.json({ type: ["application/json"] }));

taskRouter
  .route(`${Prefix.task}/`)
  /**
   * @api {get} /children/:childId/templates/:templateId/tasks Get all tasks of child
   * @apiName GetTasks
   * @apiGroup Tasks
   * @apiUse AllTasksParams
   * @apiSuccess ReferenceHateoas
   */
  .get(
    makeSchemaEndpoint(
      {
        params: allTasksParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const tasks = await prisma.task.findMany({
          where: {
            templateId: req.params.templateId,
          },
        });

        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            tasks.map((task) => {
              return new UrlBuilder()
                .addPrefix(Prefix.task, {
                  templateId: req.params.templateId,
                  childId: req.params.childId,
                })
                .addId(task.id)
                .toCompleteAPIPath();
            }),
            {
              self: new UrlBuilder()
                .addPrefix(Prefix.task, {
                  templateId: req.params.templateId,
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
   * @api {post} /children/:childId/templates/:templateId/tasks Create a task
   * @apiName CreateTask
   * @apiGroup Tasks
   * @apiUse AllTasksParams
   * @apiUse TaskPostBody
   * @apiUse TaskSuccess
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
        params: allTasksParamSchema,
        body: taskPostSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );
        const created = await prisma.task.create({
          data: asPrismaTask(req.body, req.params.templateId),
        });

        const templateId = created.templateId;

        const activities = await prisma.activity.findMany({
          where: {
            templateId: templateId,
          },
        });

        await prisma.taskProgress.createMany({
          data: activities.map((activity) => {
            return {
              taskId: created.id,
              activityId: activity.id,
            };
          }),
        });

        basicRespond(
          res,
          Status.created,
          new TaskHateaos(created, req.params.childId)
        );
      }
    )
  );

taskRouter
  .route(`${Prefix.task}/:taskId`)
  /**
   * @api {get} /children/:childId/templates/:templateId/tasks/:taskId Get a task
   * @apiName GetTask
   * @apiGroup Tasks
   * @apiUse TaskSuccess
   * @apiUse OneTaskParams
   * @apiUse ForbiddenError
   * @apiUse NotFoundError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: oneTaskParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const task = await findTaskFromParams(req.params.taskId);

        basicRespond(res, Status.ok, new TaskHateaos(task, req.params.childId));
      }
    )
  )
  /**
   * @api {patch} /children/:childId/templates/:templateId/tasks/:taskId Update a task
   * @apiName UpdateTask
   * @apiGroup Tasks
   * @apiUse OneTaskParams
   * @apiUse TaskPatchBody
   * @apiUse TaskSuccess
   *
   */
  .patch(
    makeSchemaEndpoint(
      {
        params: oneTaskParamSchema,
        body: taskPatchSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const task = await prisma.task.update({
          where: {
            id: req.params.taskId,
          },
          data: asPrismaTaskPatch(req.body, req.params.templateId),
        });
        basicRespond(res, Status.ok, new TaskHateaos(task, req.params.childId));
      }
    )
  )
  /**
   * @api {delete} /children/:childId/templates/:templateId/tasks/:taskId Delete a task
   * @apiName DeleteTask
   * @apiGroup Tasks
   * @apiUse OneTaskParams
   * @apiSuccess (204) NoContent The task was deleted
   * @apiUse NotFoundError
   * @apiUse ForbiddenError
   */
  .delete(
    makeSchemaEndpoint(
      {
        params: oneTaskParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        await prisma.task.delete({
          where: {
            id: req.params.taskId,
          },
        });
        res.status(Status.noContent).send();
      }
    )
  );
