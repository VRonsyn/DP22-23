import express, { Router, Router as router } from "express";
import prisma from "../../../database";
import { AnswerOption } from "@prisma/client";
import { ConflictError, NotFoundError } from "../../../util/errors";
import { Prefix, Status } from "../../../util/consts";
import { basicRespond, makeSchemaEndpoint } from "../../../util/express";
import { z } from "zod";
import { asPrismaAnswerOption } from "../../../types/prisma/profile";
import {
  AnswerOptionHateoas,
  answerOptionPostSchema,
} from "../../../types/express/profile";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import { toAnswerOptionIdUrl } from "../../../util/serialization";
import { findQuestionFromParams } from "./Question";
import { authorizeAsAdmin } from "../../../util/authentication";

async function findAnswerOptionFromParams(
  surveyName: string,
  questionId: string,
  answerOptionId: string
): Promise<AnswerOption> {
  const answerOption = await prisma.answerOption.findFirst({
    where: {
      id: answerOptionId,
      question: {
        id: questionId,
        surveyName: surveyName,
      },
    },
  });
  if (!answerOption) {
    throw new NotFoundError(
      `AnswerOption with id "${answerOptionId}" and on question with id "${questionId}" that is part of survey "${surveyName}" not found.`
    );
  }
  return answerOption;
}

/**
 * @apiDefine AnswerOptionPrefixParams
 * @apiParam {String} surveyName The name of the survey
 * @apiParam {String} questionId The id of the question
 */
const prefixParamSchema = z.object({
  surveyName: z.string(),
  questionId: z.string(),
});

export const answerOptionRouter: Router = router();

// Set json middleware
answerOptionRouter.use(express.json({ type: ["application/json"] }));

answerOptionRouter
  .route(`${Prefix.answerOption}/`)
  /**
   * @api {get} /surveys/:surveyName/questions/:questionId/answerOptions Get all answer options of a question
   * @apiName GetAnswerOptionsFromQuestion
   * @apiGroup AnswerOptions
   *
   * @apiUse AnswerOptionPrefixParams
   * @apiUse ReferenceHateoas
   * @apiUse InvalidParameterError
   */
  // Path is used in survey hateoas links, keep up to date
  .get(
    makeSchemaEndpoint(
      {
        params: prefixParamSchema,
      },
      async (req, res) => {
        const question = await findQuestionFromParams(
          req.params.surveyName,
          req.params.questionId
        );
        const answerOptions = await prisma.answerOption.findMany({
          where: { questionId: question.id },
          select: { id: true },
        });
        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            answerOptions.map((option) =>
              toAnswerOptionIdUrl(
                req.params.surveyName,
                req.params.questionId,
                option.id
              )
            ),
            {
              self: toAnswerOptionIdUrl(
                req.params.surveyName,
                req.params.questionId,
                ""
              ),
            }
          )
        );
      }
    )
  )
  /**
   * @api {post} /surveys/:surveyName/questions/:questionId/answerOptions Create a new answerOption
   * @apiName CreateAnswerOption
   * @apiGroup AnswerOptions
   *
   * @apiUse jsonHeader
   * @apiUse AnswerOptionPrefixParams
   * @apiUse AnswerSuccess
   * @apiUse AnswerOptionPostBody
   * @apiUse InvalidReferenceError
   * @apiUse NotFoundError
   * @apiUse ConflictError
   */
  .post(
    makeSchemaEndpoint(
      {
        body: answerOptionPostSchema,
        params: prefixParamSchema,
      },
      async (req, res) => {
        await authorizeAsAdmin(req.headers.authorization);
        await findQuestionFromParams(
          req.params.surveyName,
          req.params.questionId
        );

        try {
          const created: AnswerOption = await prisma.answerOption.create({
            data: asPrismaAnswerOption(req.body, req.params.questionId),
          });
          basicRespond(
            res,
            Status.created,
            new AnswerOptionHateoas(created, req.params.surveyName)
          );
        } catch (e) {
          throw new ConflictError();
        }
      }
    )
  );

/**
 * @api {get} /surveys/:surveyName/questions/:questionId/answerOptions/:answerOptionId Get an answerOption
 * @apiName GetAnswerOption
 * @apiGroup AnswerOptions
 *
 * @apiUse AnswerOptionPrefixParams
 * @apiParam {String} answerOptionId The id of the answerOption
 * @apiUse AnswerSuccess
 * @apiUse InvalidParameterError
 */
answerOptionRouter.route(`${Prefix.answerOption}/:answerOptionId`).get(
  makeSchemaEndpoint(
    {
      params: z
        .object({
          answerOptionId: z.string(),
        })
        .merge(prefixParamSchema),
    },
    async (req, res) => {
      const answerOption = await findAnswerOptionFromParams(
        req.params.surveyName,
        req.params.questionId,
        req.params.answerOptionId
      );
      basicRespond(
        res,
        Status.ok,
        new AnswerOptionHateoas(answerOption, req.params.surveyName)
      );
    }
  )
);
