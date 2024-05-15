import { z } from "zod";
import express, { Router as router, Router } from "express";
import {
  basicRespond,
  makeSchemaEndpoint,
  validate,
} from "../../../util/express";
import prisma from "../../../database";
import { ConflictError, NotFoundError } from "../../../util/errors";
import { Prefix, Status } from "../../../util/consts";
import { toIdUrl, toSubmittedSurveyIdUrl } from "../../../util/serialization";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import { authorizeAtLeastGuardian } from "../../../util/authentication";
import {
  SubmittedSurveyHateoas,
  submittedSurveyPostSchema,
  SurveySettingTracker,
} from "../../../types/express/profile";
import { asPrismaSubmittedSurvey } from "../../../types/prisma/profile";
import { idURLToSurveyName } from "../../../util/parser";
import {
  ChildColor,
  Prisma,
  SubmittedSurvey,
  SurveyType,
} from "@prisma/client";
import { UrlBuilder } from "../../../util/urlBuilder";

export async function findSubmittedSurveyFromParams(
  childId: string,
  submittedSurveyId: string
): Promise<SubmittedSurvey> {
  const submittedSurvey = await prisma.submittedSurvey.findFirst({
    where: { id: submittedSurveyId, childId: childId },
  });
  if (!submittedSurvey) {
    throw new NotFoundError(
      `SubmittedSurvey with id "${submittedSurveyId}" and on child with id "${childId}" not found.`
    );
  }
  return submittedSurvey;
}

/**
 * @apiDefine SubmittedSurveyPrefixParams
 * @apiParam {String} childId The id of the child
 */
const prefixParamSchema = z.object({
  childId: z.string(),
});

export const submittedSurveyRouter: Router = router();

// Set json middleware
submittedSurveyRouter.use(express.json({ type: ["application/json"] }));

submittedSurveyRouter
  .route(`${Prefix.submittedSurvey}/`)
  /**
   * @api {get} /children/:childId/submittedSurveys Get all submitted surveys of child
   * @apiName GetSubmittedSurveys
   * @apiGroup SubmittedSurveys
   * @apiUse SubmittedSurveyPrefixParams
   * @apiUse ReferenceHateoas
   * @apiSuccess {Object} _links The links to the child and self
   * @apiSuccess {String} _links.child The URL to the child
   * @apiUse ForbiddenError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: prefixParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const submissions = await prisma.submittedSurvey.findMany({
          where: {
            childId: req.params.childId,
          },
        });
        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            submissions.map((submission) =>
              toSubmittedSurveyIdUrl(req.params.childId, submission.id)
            ),
            {
              self: toSubmittedSurveyIdUrl(req.params.childId, ""),
              child: toIdUrl(req.params.childId, Prefix.child),
            }
          )
        );
      }
    )
  )
  /**
   * @api {post} /children/:childId/submittedSurveys Create a submitted survey
   * @apiName CreateSubmittedSurvey
   * @apiGroup SubmittedSurveys
   * @apiUse SubmittedSurveyPrefixParams
   * @apiUse SubmittedSurveySuccess
   * @apiUse SubmittedSurveyPostBody
   * @apiUse ForbiddenError
   * @apiUse InvalidReferenceError
   * @apiUse RequestTypeError
   * @apiUse IdUrlParseError
   */
  .post(
    makeSchemaEndpoint(
      {
        params: prefixParamSchema,
        body: submittedSurveyPostSchema,
      },
      async (req, res) => {
        // Also checks the existence of the child
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const { createObject } = await validate(req.body, {
          createConverter: (parsedBody) =>
            asPrismaSubmittedSurvey(parsedBody, req.params.childId),
          referenceCheckers: [
            {
              checker: async (identifier) =>
                prisma.survey.findUnique({
                  where: { name: idURLToSurveyName(identifier) },
                }),
              identifier: "surveyUrl",
            },
          ],
        });

        const created = await prisma.submittedSurvey.create({
          data: createObject,
        });
        basicRespond(res, Status.created, new SubmittedSurveyHateoas(created));
      }
    )
  );

/**
 * @api {get} /children/:childId/submittedSurveys/:submittedSurveyId Get a submitted survey
 * @apiName GetSubmittedSurvey
 * @apiGroup SubmittedSurveys
 * @apiUse SubmittedSurveyPrefixParams
 * @apiParam {String} submittedSurveyId The id of the submitted survey
 * @apiUse SubmittedSurveySuccess
 * @apiUse ForbiddenError
 */
submittedSurveyRouter.route(`${Prefix.submittedSurvey}/:submittedSurveyId`).get(
  makeSchemaEndpoint(
    {
      params: prefixParamSchema.extend({
        submittedSurveyId: z.string(),
      }),
    },
    async (req, res) => {
      await authorizeAtLeastGuardian(
        req.headers.authorization,
        req.params.childId
      );

      const submittedSurvey = await findSubmittedSurveyFromParams(
        req.params.childId,
        req.params.submittedSurveyId
      );
      basicRespond(res, Status.ok, new SubmittedSurveyHateoas(submittedSurvey));
    }
  )
);

/**
 * @api {post} /children/:childId/submittedSurveys/:submittedSurveyId/postResultedSettings Edit the child's in accordance with this survey submission
 * @apiName PostResultedSettings
 * @apiGroup SubmittedSurveys
 * @apiUse SubmittedSurveyPrefixParams
 * @apiParam {String} submittedSurveyId The id of the submitted survey
 * @apiUse ForbiddenError
 * @apiUse NotFoundError
 * @apiSuccess (302) {String} Location The URL to the child
 */
submittedSurveyRouter.route(Prefix.postResultedSettings).post(
  makeSchemaEndpoint(
    {
      params: prefixParamSchema.extend({
        submittedSurveyId: z.string(),
      }),
    },
    async (req, res) => {
      await authorizeAtLeastGuardian(
        req.headers.authorization,
        req.params.childId
      );

      // Check if the submitted survey exists and all questions have been answered
      const submittedSurvey = await prisma.submittedSurvey.findFirst({
        where: {
          id: req.params.submittedSurveyId,
          childId: req.params.childId,
          survey: {
            surveyType: SurveyType.QUESTIONNAIRE,
          },
        },
        include: {
          answers: {
            include: {
              answerOption: true,
            },
          },
          survey: {
            include: {
              questions: true,
            },
          },
        },
      });
      if (!submittedSurvey) {
        throw new NotFoundError(
          `SubmittedSurvey with id "${req.params.submittedSurveyId}" and on child with id "${req.params.childId}" not found.`
        );
      }
      if (
        submittedSurvey.answers.length !==
        submittedSurvey.survey.questions.length
      ) {
        throw new ConflictError(
          "SubmittedSurvey has not answered all questions."
        );
      }

      const prevChild = await prisma.child.findFirst({
        where: {
          id: req.params.childId,
        },
        include: {
          settings: true,
        },
      });

      function patchAwayColor(
        color: ChildColor,
        settingsPatch: Prisma.ChildSettingsUpdateInput
      ) {
        if (!prevChild) {
          throw new Error(
            "Can not find child even-though it was authorized, can not happen."
          );
        }
        for (const [key, value] of Object.entries(prevChild.settings)) {
          if (value === color) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            settingsPatch[key] = ChildColor.GREY;
          }
        }
      }

      // Start patching the settings
      const settingsPatch: Prisma.ChildSettingsUpdateInput = {};
      for (const answer of submittedSurvey.answers) {
        for (const [key, value] of Object.entries(
          answer.answerOption.partialSettings ?? {}
        )) {
          switch (key) {
            case SurveySettingTracker.preferDark:
              if (value) {
                settingsPatch.primaryColor = ChildColor.GREY;
                settingsPatch.mondayColor = ChildColor.GREY;
                settingsPatch.tuesdayColor = ChildColor.GREY;
                settingsPatch.wednesdayColor = ChildColor.GREY;
                settingsPatch.thursdayColor = ChildColor.GREY;
                settingsPatch.fridayColor = ChildColor.GREY;
                settingsPatch.saturdayColor = ChildColor.GREY;
                settingsPatch.sundayColor = ChildColor.GREY;
                settingsPatch.paletteFirst = ChildColor.GREY;
                settingsPatch.paletteSecond = ChildColor.GREY;
                settingsPatch.paletteThird = ChildColor.GREY;
                settingsPatch.paletteFourth = ChildColor.GREY;
                settingsPatch.paletteFifth = ChildColor.GREY;
                settingsPatch.paletteSixth = ChildColor.GREY;
                settingsPatch.paletteSeventh = ChildColor.GREY;
              }
              break;
            case SurveySettingTracker.colorFright:
              if (value) {
                patchAwayColor(value, settingsPatch);
              }
              break;
            default:
              // Type unsafe for ease of development right now and the types can only be injected by admins. Let's thrust them.
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              settingsPatch[key] = value;
          }
        }
      }

      const child = await prisma.child.update({
        where: { id: req.params.childId },
        data: {
          settings: {
            update: settingsPatch,
          },
        },
      });

      // Redirect to child.
      res.redirect(
        new UrlBuilder()
          .addPrefix(Prefix.child, {})
          .addId(child.id)
          .toCompleteAPIPath()
      );
    }
  )
);
