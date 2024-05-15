import { Prisma } from "@prisma/client";
import {
  AnswerOptionPost,
  QuestionPost,
  SubmittedSurveyAnswerPost,
  SubmittedSurveyPost,
  SurveyPost,
} from "../express/profile";
import {
  idURLToAnswerOptionFields,
  idURLToSurveyName,
} from "../../util/parser";

/**
 * @param answerOption AnswerOptionPost to be converted to a Prisma AnswerOption
 * @param questionId id of the question the answerOption belongs to
 * @returns Prisma.QuestionUncheckedCreateInput
 */
export function asPrismaAnswerOption(
  answerOption: AnswerOptionPost,
  questionId: string
): Prisma.AnswerOptionUncheckedCreateInput {
  return {
    answer: answerOption.answer,
    questionId,
    options: answerOption.options,
    partialSettings: answerOption.partialSettings,
    referenceNumber: answerOption.referenceNumber,
  };
}

/**
 * @param question QuestionPost to be converted to a Prisma Question
 * @param surveyName name of the survey the question belongs to
 * @returns Prisma.QuestionUncheckedCreateInput
 */
export function asPrismaQuestion(
  question: QuestionPost,
  surveyName: string
): Prisma.QuestionUncheckedCreateInput {
  return {
    title: question.title,
    description: question.description,
    surveyName,
    referenceNumber: question.referenceNumber,
  };
}

/**
 * @param survey unknown object to be converted to a Prisma.SurveyUncheckedCreateInput
 * @returns Prisma.SurveyUncheckedCreateInput
 * @throws RequestTypeError if the object is not a valid Survey
 */
export function asPrismaSurvey(
  survey: SurveyPost
): Prisma.SurveyUncheckedCreateInput {
  return {
    name: survey.name,
    surveyType: survey.surveyType,
    language: survey.language,
  };
}

export function asPrismaSubmittedSurvey(
  submittedSurvey: SubmittedSurveyPost,
  childId: string
): Prisma.SubmittedSurveyUncheckedCreateInput {
  return { childId, surveyName: idURLToSurveyName(submittedSurvey.surveyUrl) };
}

export function asPrismaSubmittedSurveyAnswer(
  submittedSurveyAnswer: SubmittedSurveyAnswerPost,
  submittedSurveyId: string
): Prisma.SubmittedSurveyAnswerUncheckedCreateInput {
  return {
    openAnswer: submittedSurveyAnswer.openAnswer,
    answerOptionId: idURLToAnswerOptionFields(
      submittedSurveyAnswer.answerOptionUrl
    ),
    submittedSurveyId,
  };
}
