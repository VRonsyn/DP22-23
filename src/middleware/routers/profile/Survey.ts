import express, { Router, Router as router } from "express";
import prisma from "../../../database";
import { Survey, SurveyType } from "@prisma/client";
import { toCompleteAPIPath, toIdUrl } from "../../../util/serialization";
import { InvalidParameterError, NotFoundError } from "../../../util/errors";
import { Prefix, Status } from "../../../util/consts";
import {
  basicRespond,
  makeSchemaEndpoint,
  validate,
} from "../../../util/express";
import { z } from "zod";
import { asPrismaSurvey } from "../../../types/prisma/profile";
import {
  SurveyHateoas,
  surveyPostSchema,
} from "../../../types/express/profile";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import validator from "validator";
import { authorizeAsAdmin } from "../../../util/authentication";
import isLocale = validator.isLocale;

export async function findSurveyFromParams(
  surveyName: string
): Promise<Survey> {
  const survey = await prisma.survey.findUnique({
    where: { name: surveyName },
  });
  if (!survey) {
    throw new InvalidParameterError("surveyName", surveyName);
  }
  return survey;
}

export const surveyRouter: Router = router();
// Set json middleware
surveyRouter.use(express.json({ type: ["application/json"] }));

/**
 * @apiDefine SurveyQueryParams
 * @apiQuery {String} surveyType The type of the survey
 * @apiQuery {String} language The language of the survey
 */
const querySurveyTypeSchema = z.object({
  surveyType: z
    .enum([SurveyType.FEEDBACK, SurveyType.QUESTIONNAIRE])
    .optional(),
  language: z
    .string()
    .optional()
    .refine((str) => (str === undefined ? true : isLocale(str))),
});

// Surveys are immutable, therefore there are only a limited amount of operations.
surveyRouter
  .route(`${Prefix.survey}/`)
  /**
   * @api {get} /surveys Get all surveys
   * @apiName GetSurveys
   * @apiGroup Survey
   * @apiUse SurveyQueryParams
   * @apiUse ReferenceHateoas
   */
  .get(
    makeSchemaEndpoint(
      {
        query: querySurveyTypeSchema,
      },
      async (req, res) => {
        const surveys = await prisma.survey.findMany({
          select: { name: true },
          where: {
            surveyType: req.query.surveyType,
            language: req.query.language,
          },
        });
        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            surveys.map((survey) => toIdUrl(survey.name, Prefix.survey)),
            {
              self: toCompleteAPIPath(Prefix.survey),
            }
          )
        );
      }
    )
  )
  /**
   * @api {post} /surveys Create a new survey
   * @apiName CreateSurvey
   * @apiGroup Survey
   * @apiUse SurveyPostBody
   * @apiUse jsonHeader
   * @apiUse SurveySuccess
   * @apiUse NotUniqueError
   * @apiUse RequestTypeError
   */
  .post(
    makeSchemaEndpoint(
      {
        body: surveyPostSchema,
      },
      async (req, res) => {
        await authorizeAsAdmin(req.headers.authorization);
        const { createObject } = await validate(req.body, {
          createConverter: asPrismaSurvey,
          uniquenessChecker: [
            {
              checker: (identifier) =>
                prisma.survey.findUnique({ where: { name: identifier } }),
              identifier: "name",
            },
          ],
        });
        const created: Survey = await prisma.survey.create({
          data: createObject,
        });
        basicRespond(res, Status.created, new SurveyHateoas(created));
      }
    )
  );

/**
 * @api {get} /surveys/recent Get the most recent survey
 * @apiName GetRecentSurvey
 * @apiGroup Survey
 * @apiUse SurveyQueryParams
 * @apiUse SurveySuccess
 * @apiUse NotFoundError
 */
surveyRouter.get(
  `${Prefix.survey}/recent`,
  makeSchemaEndpoint(
    {
      query: querySurveyTypeSchema,
    },
    async (req, res) => {
      const survey = await prisma.survey.findFirst({
        orderBy: { creationTime: "desc" },
        where: {
          surveyType: req.query.surveyType,
          language: req.query.language,
        },
      });
      if (!survey) {
        throw new NotFoundError("No surveys found");
      }
      basicRespond(res, Status.ok, new SurveyHateoas(survey));
    }
  )
);

/**
 * @api {get} /surveys/:surveyName Get a survey
 * @apiName GetSurvey
 * @apiGroup Survey
 * @apiParam {String} surveyName The name of the survey
 * @apiUse SurveySuccess
 * @apiUse InvalidParameterError
 */
surveyRouter.get(
  `${Prefix.survey}/:surveyName`,
  makeSchemaEndpoint(
    {
      params: z.object({
        surveyName: z.string(),
      }),
    },
    async (req, res) => {
      const survey = await findSurveyFromParams(req.params.surveyName);
      basicRespond(res, Status.ok, new SurveyHateoas(survey));
    }
  )
);
