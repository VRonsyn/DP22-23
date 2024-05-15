import express, { Router, Router as router } from "express";
import prisma from "../../../database";
import { Question } from "@prisma/client";
import { Prefix, Status } from "../../../util/consts";
import { ConflictError, NotFoundError } from "../../../util/errors";
import { basicRespond, makeSchemaEndpoint } from "../../../util/express";
import { z } from "zod";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import { asPrismaQuestion } from "../../../types/prisma/profile";
import {
  QuestionHateoas,
  questionPostSchema,
} from "../../../types/express/profile";
import { findSurveyFromParams } from "./Survey";
import { authorizeAsAdmin } from "../../../util/authentication";
import { UrlBuilder } from "../../../util/urlBuilder";

export async function findQuestionFromParams(
  surveyName: string,
  questionId: string
): Promise<Question> {
  const question = await prisma.question.findFirst({
    where: { id: questionId, surveyName: surveyName },
  });
  if (!question) {
    throw new NotFoundError(
      `Question with id "${questionId}" and on survey with name "${surveyName}" not found.`
    );
  }
  return question;
}

/**
 * @apiDefine QuestionPrefixParams
 * @apiParam {String} surveyName The name of the survey
 */
const prefixParamSchema = z.object({
  surveyName: z.string(),
});

export const questionRouter: Router = router();

// Set json middleware
questionRouter.use(express.json({ type: ["application/json"] }));

questionRouter
  /**
   * @api {get} /surveys/:surveyName/questions Get all questions on survey
   * @apiName GetQuestionsOfSurvey
   * @apiGroup Questions
   * @apiUse QuestionPrefixParams
   * @apiUse ReferenceHateoas
   * @apiUse NotFoundError
   */
  .route(`${Prefix.question}/`)
  .get(
    makeSchemaEndpoint(
      {
        params: prefixParamSchema,
      },
      async (req, res) => {
        const survey = await findSurveyFromParams(req.params.surveyName);
        const questions = await prisma.question.findMany({
          where: { surveyName: survey.name },
          select: { id: true },
        });
        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            questions.map((q) =>
              new UrlBuilder()
                .addPrefix(Prefix.question, {
                  surveyName: survey.name,
                })
                .addId(q.id)
                .toCompleteAPIPath()
            ),
            {
              self: new UrlBuilder()
                .addPrefix(Prefix.question, {
                  surveyName: survey.name,
                })
                .toCompleteAPIPath(),
            }
          )
        );
      }
    )
  )
  /**
   * @api {post} /surveys/:surveyName/questions Create a new question
   * @apiName CreateQuestion
   * @apiGroup Questions
   *
   * @apiUse QuestionPrefixParams
   * @apiUse jsonHeader
   * @apiUse QuestionPostBody
   * @apiUse QuestionSuccess
   * @apiUse NotFoundError
   * @apiUse RequestTypeError
   * @apiUse ConflictError
   */
  .post(
    makeSchemaEndpoint(
      {
        body: questionPostSchema,
        params: prefixParamSchema,
      },
      async (req, res) => {
        await authorizeAsAdmin(req.headers.authorization);
        await findSurveyFromParams(req.params.surveyName);

        try {
          const created: Question = await prisma.question.create({
            data: asPrismaQuestion(req.body, req.params.surveyName),
          });
          basicRespond(res, Status.created, new QuestionHateoas(created));
        } catch (e) {
          throw new ConflictError();
        }
      }
    )
  );

/**
 * @api {get} /surveys/:surveyName/questions/:questionId Get a question
 * @apiName GetQuestionFromId
 * @apiGroup Questions
 * @apiParam {String} questionId The id of the question
 * @apiUse QuestionPrefixParams
 * @apiUse QuestionSuccess
 * @apiUse InvalidParameterError
 */
questionRouter.route(`${Prefix.question}/:questionId`).get(
  makeSchemaEndpoint(
    {
      params: z
        .object({
          questionId: z.string(),
        })
        .merge(prefixParamSchema),
    },
    async (req, res) => {
      const question = await findQuestionFromParams(
        req.params.surveyName,
        req.params.questionId
      );
      basicRespond(res, Status.ok, new QuestionHateoas(question));
    }
  )
);
