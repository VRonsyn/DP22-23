import { z } from "zod";
import express, { Router as router, Router } from "express";
import { basicRespond, makeSchemaEndpoint } from "../../../util/express";
import prisma from "../../../database";
import {
  ConflictError,
  InvalidReferenceError,
  NotFoundError,
} from "../../../util/errors";
import { Prefix, Status } from "../../../util/consts";
import {
  toIdUrl,
  toSubmittedSurveyAnswerIdUrl,
  toSubmittedSurveyIdUrl,
} from "../../../util/serialization";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import { authorizeAtLeastGuardian } from "../../../util/authentication";
import {
  SubmittedSurveyAnswerHateoas,
  SubmittedSurveyAnswerPost,
  submittedSurveyAnswerPostSchema,
} from "../../../types/express/profile";
import { asPrismaSubmittedSurveyAnswer } from "../../../types/prisma/profile";
import { SubmittedSurveyAnswer } from "@prisma/client";
import { parseRelativePathSafe } from "../../../util/parser";

type SubmittedSurveyAnswerWithExtras = {
  submittedAnswer: SubmittedSurveyAnswer;
  childId: string;
  surveyName: string;
  questionId: string;
};
export async function findSubmittedSurveyAnswerFromParams(
  childId: string,
  submittedSurveyId: string,
  submittedSurveyAnswerId: string
): Promise<SubmittedSurveyAnswerWithExtras> {
  // Here we are getting from the db. No need to check if duplicate survey link is correct
  const submittedSurveyAnswer = await prisma.submittedSurveyAnswer.findFirst({
    where: {
      id: submittedSurveyAnswerId,
      submittedSurvey: {
        childId: childId,
        id: submittedSurveyId,
      },
    },
    include: {
      answerOption: {
        select: {
          question: {
            select: {
              surveyName: true,
              id: true,
            },
          },
        },
      },
    },
  });
  if (!submittedSurveyAnswer) {
    throw new NotFoundError(
      `SubmittedSurveyAnswer with id "${submittedSurveyAnswerId}" on submittedSurvey with id "${submittedSurveyAnswerId}" and on child with id "${childId}" not found.`
    );
  }

  const res = {
    submittedAnswer: submittedSurveyAnswer,
    childId: childId,
    surveyName: submittedSurveyAnswer.answerOption.question.surveyName,
    questionId: submittedSurveyAnswer.answerOption.question.id,
  };
  delete (
    submittedSurveyAnswer as SubmittedSurveyAnswer & { answerOption?: unknown }
  ).answerOption;
  return res;
}

/**
 * @apiDefine SubmittedSurveyAnswerPrefixParams
 * @apiParam {String} childId The id of the child
 * @apiParam {String} submittedSurveyId The id of the submitted survey
 */
const prefixParamSchema = z.object({
  childId: z.string(),
  submittedSurveyId: z.string(),
});

export const submittedSurveyAnswerRouter: Router = router();

// Set json middleware
submittedSurveyAnswerRouter.use(express.json({ type: ["application/json"] }));

submittedSurveyAnswerRouter
  .route(`${Prefix.submittedSurveyAnswer}/`)
  /**
   * @api {get} /children/:childId/submittedSurveys/:submittedSurveyId/submittedSurveyAnswers Get all submitted survey answers of a submitted survey
   * @apiName GetSubmittedSurveyAnswers
   * @apiGroup SubmittedSurveyAnswer
   * @apiUse ReferenceHateoas
   * @apiUse SubmittedSurveyAnswerPrefixParams
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

        const answers = await prisma.submittedSurveyAnswer.findMany({
          where: {
            submittedSurvey: {
              childId: req.params.childId,
              id: req.params.submittedSurveyId,
            },
          },
        });
        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            answers.map((answer) =>
              toSubmittedSurveyAnswerIdUrl(
                req.params.childId,
                req.params.submittedSurveyId,
                answer.id
              )
            ),
            {
              self: toSubmittedSurveyAnswerIdUrl(
                req.params.childId,
                req.params.submittedSurveyId,
                ""
              ),
              child: toIdUrl(req.params.childId, Prefix.child),
              submittedSurvey: toSubmittedSurveyIdUrl(
                req.params.childId,
                req.params.submittedSurveyId
              ),
            }
          )
        );
      }
    )
  )
  /**
   * @api {post} /children/:childId/submittedSurveys/:submittedSurveyId/submittedSurveyAnswers Create a submitted survey answer
   * @apiName CreateSubmittedSurveyAnswer
   * @apiGroup SubmittedSurveyAnswer
   * @apiUse SubmittedSurveyAnswerPrefixParams
   * @apiUse SubmittedSurveyAnswerSuccess
   * @apiUse SubmittedSurveyAnswerPostBody
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
        params: prefixParamSchema,
        body: submittedSurveyAnswerPostSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        // Check if answerOptionUrl is correct
        const parsedAnswerOptionUrl = parseRelativePathSafe(
          req.body.answerOptionUrl,
          `${Prefix.answerOption}/:answerOptionId`,
          ["surveyName", "questionId", "answerOptionId"]
        );
        if (
          !(await prisma.answerOption.findFirst({
            where: {
              id: parsedAnswerOptionUrl.answerOptionId,
              question: {
                id: parsedAnswerOptionUrl.questionId,
                surveyName: parsedAnswerOptionUrl.surveyName,
              },
            },
          }))
        ) {
          throw new InvalidReferenceError<SubmittedSurveyAnswerPost>(
            "answerOptionUrl",
            "answerOptionId"
          );
        }

        // Check if params are correct & surveyNames match
        if (
          !(await prisma.submittedSurvey.findFirst({
            where: {
              childId: req.params.childId,
              id: req.params.submittedSurveyId,
              surveyName: parsedAnswerOptionUrl.surveyName,
            },
          }))
        ) {
          throw new NotFoundError(
            `SubmittedSurvey with id "${req.params.submittedSurveyId}" and on child with id "${req.params.childId}" not found.`
          );
        }

        try {
          const created = await prisma.submittedSurveyAnswer.create({
            data: asPrismaSubmittedSurveyAnswer(
              req.body,
              req.params.submittedSurveyId
            ),
          });
          basicRespond(
            res,
            Status.created,
            new SubmittedSurveyAnswerHateoas(
              created,
              req.params.childId,
              parsedAnswerOptionUrl.surveyName,
              parsedAnswerOptionUrl.questionId
            )
          );
        } catch (e: unknown) {
          throw new ConflictError();
        }
      }
    )
  );

/**
 * @api {get} /children/:childId/submittedSurveys/:submittedSurveyId/submittedSurveyAnswers/:submittedSurveyAnswerId Get a submitted survey answer
 * @apiName GetSubmittedSurveyAnswer
 * @apiGroup SubmittedSurveyAnswer
 * @apiUse SubmittedSurveyAnswerPrefixParams
 * @apiParam {String} submittedSurveyAnswerId The id of the submitted survey answer
 * @apiUse SubmittedSurveyAnswerSuccess
 * @apiUse ForbiddenError
 * @apiUse NotFoundError
 */
submittedSurveyAnswerRouter
  .route(`${Prefix.submittedSurveyAnswer}/:submittedSurveyAnswerId`)
  .get(
    makeSchemaEndpoint(
      {
        params: prefixParamSchema.extend({
          submittedSurveyAnswerId: z.string(),
        }),
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const refs = await findSubmittedSurveyAnswerFromParams(
          req.params.childId,
          req.params.submittedSurveyId,
          req.params.submittedSurveyAnswerId
        );
        basicRespond(
          res,
          Status.ok,
          new SubmittedSurveyAnswerHateoas(
            refs.submittedAnswer,
            refs.childId,
            refs.surveyName,
            refs.questionId
          )
        );
      }
    )
  );
