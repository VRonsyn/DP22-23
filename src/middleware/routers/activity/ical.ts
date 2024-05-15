import { Router as router, Router } from "express";
import { Prefix, Status } from "../../../util/consts";
import { makeSchemaEndpoint } from "../../../util/express";
import prisma from "../../../database";
import ical from "ical-generator";
import { z } from "zod";
import { NotFoundError } from "../../../util/errors";

export const icalRouter: Router = router();

/**
 * @apiDefine icalParams
 * @apiParam {String} childId The id of the child
 */
const icalParamSchema = z.object({
  childId: z.string().uuid(),
});

/**
 * @apiDefine icalQuery
 * @apiParam {DateTime} before The start moment before which the activities should be returned
 * @apiParam {DateTime} after The start moment after which the activities should be returned
 * @apiParam {Number} limit The maximum number of activities to return
 * @apiParam {Number} skip The number of activities to skip
 */
const icalQuerySchema = z.object({
  before: z.coerce.date().optional(),
  after: z.coerce.date().optional(),
  limit: z.number().optional(),
  skip: z.number().optional(),
});

icalRouter
  .route(`${Prefix.ical}/`)
  /**
   * @api {get} /children/:childId/ical Get the ical feed for a child. (No auth required)
   * @apiName GetIcal
   * @apiGroup ICalendar
   * @apiUse icalParams
   * @apiUse icalQuery
   */
  .get(
    makeSchemaEndpoint(
      {
        params: icalParamSchema,
        query: icalQuerySchema,
      },
      async (req, res) => {
        let activities;
        try {
          activities = await prisma.activity.findMany({
            where: {
              childId: req.params.childId,
              start: { gte: req.query.after, lte: req.query.before },
            },
            take: req.query.limit,
            skip: req.query.skip,
            include: {
              template: {
                include: {
                  tasks: true,
                },
              },
            },
          });
        } catch (e) {
          throw new NotFoundError("Child not found.");
        }
        const child = await prisma.child.findUnique({
          where: {
            id: req.params.childId,
          },
        });
        if (!child) {
          throw new Error(
            "Child was not found even though prisma did not throw an error when fetching activities."
          );
        }

        const calendar = ical({
          name: `Calender of ${child.name}`,
          description: `The calender of ${child.name} generated by AS planneD.`,
          timezone: "Europe/Brussels",
          ttl: 900,
        });

        for (const activity of activities) {
          const template = activity.template;

          // Construct description.
          let description = template.description ?? "";
          const sortedTasks = template.tasks.sort(
            (a, b) => a.referenceNumber - b.referenceNumber
          );
          description += sortedTasks
            .map((task) => {
              let sub = `* ${task.summary}`;
              if (task.description || task.duration) {
                sub += ":";
              }
              if (task.description) {
                sub += `\n\t${task.description}`;
              }
              if (task.duration) {
                sub += `\n\tTakes ${task.duration} minutes.`;
              }
              return sub;
            })
            .join("\n");

          let loc: null | {
            title: string;
            geo?: { lat: number; lon: number };
          } = null;
          if (template.location) {
            loc = {
              title: template.location,
            };
            if (template.geoLat && template.geoLon) {
              loc.geo = {
                lat: template.geoLat,
                lon: template.geoLon,
              };
            }
          }

          const milisInSecond = 1_000;
          calendar.createEvent({
            start: activity.start,
            end: new Date(
              activity.start.getTime() + template.duration * milisInSecond
            ),
            summary: template.summary,
            description,
            location: loc,
            timezone: "Europe/Brussels",
          });
        }

        res
          .status(Status.ok)
          .contentType("text/calendar")
          .send(calendar.toString());
      }
    )
  );
