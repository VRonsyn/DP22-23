import { z } from "zod";
import {
  AnswerOption,
  Question,
  SubmittedSurvey,
  SubmittedSurveyAnswer,
  Survey,
  SurveyType,
} from "@prisma/client";
import { SimpleHateoas } from "./hateoas";
import {
  toAnswerOptionIdUrl,
  toIdUrl,
  toQuestionIdUrl,
  toSubmittedSurveyAnswerIdUrl,
  toSubmittedSurveyIdUrl,
} from "../../util/serialization";
import { Prefix } from "../../util/consts";
import validator from "validator";
import { UrlBuilder } from "../../util/urlBuilder";
import isLocale = validator.isLocale;

export enum SurveySettingTracker {
  colorFright = "colorFright",
  preferDark = "preferDark",
}

/**
 * @apiDefine AnswerSuccess
 * @apiUse Hateoas
 * @apiSuccess {String} answer The answer to the question
 * @apiSuccess {Object} options The Options for the answer
 * @apiSuccess {int} referenceNumber The reference number of the answer
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.question Link to the question the answer belongs to
 */
export class AnswerOptionHateoas extends SimpleHateoas<AnswerOption> {
  public referenceFields: (keyof AnswerOption)[] = ["questionId"];
  public data: AnswerOption;

  public constructor(data: AnswerOption, private surveyName: string) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: toAnswerOptionIdUrl(
        this.surveyName,
        this.data.questionId,
        this.data.id
      ),
      question: new UrlBuilder()
        .addPrefix(Prefix.question, {
          surveyName: this.surveyName,
        })
        .addId(this.data.questionId)
        .toCompleteAPIPath(),
    };
  }
}

export const answerOptionPostSchema = z.object({
  answer: z.string(),
  // Check if options is given that it is an object and do not cut away the values.
  options: z.object({}).passthrough().optional(),
  partialSettings: z.object({}).passthrough(),
  referenceNumber: z.number(),
});

/**
 * @apiDefine AnswerOptionPostBody
 * @apiBody {String} answer The answer to the question
 * @apiBody {Object} options The Options for the answer
 * @apiBody {int} referenceNumber The reference number of the answer
 * @apiBody {Object} partialSettings The partialSettings for the answer
 */
export type AnswerOptionPost = z.infer<typeof answerOptionPostSchema>;

/**
 * @apiDefine QuestionSuccess
 * @apiUse Hateoas
 * @apiSuccess {String} title The title of the question
 * @apiSuccess {String} description The description of the question
 * @apiSuccess {int} referenceNumber The reference number of the question
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.survey Link to the survey the question belongs to
 */
export class QuestionHateoas extends SimpleHateoas<Question> {
  public referenceFields: (keyof Question)[] = ["surveyName"];
  public data: Question;

  public constructor(data: Question) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: new UrlBuilder()
        .addPrefix(Prefix.question, {
          surveyName: this.data.surveyName,
        })
        .addId(this.data.id)
        .toCompleteAPIPath(),

      survey: new UrlBuilder()
        .addPrefix(Prefix.survey, {})
        .addId(this.data.surveyName)
        .toCompleteAPIPath(),
      answerOptions: new UrlBuilder()
        .addPrefix(Prefix.answerOption, {
          surveyName: this.data.surveyName,
          questionId: this.data.id,
        })
        .toCompleteAPIPath(),
    };
  }
}

/**
 * @apiDefine QuestionPostBody
 * @apiBody {String} title The title of the question
 * @apiBody {String} description The description of the question
 * @apiBody {int} referenceNumber The reference number of the question
 */
export type QuestionPost = z.infer<typeof questionPostSchema>;

export const questionPostSchema = z.object({
  title: z.string(),
  description: z.string(),
  referenceNumber: z.number(),
});

/**
 * @apiDefine SurveySuccess
 * @apiUse Hateoas
 * @apiSuccess {String} name The name of the survey
 * @apiSuccess {Date} creationTime The time the survey was created
 * @apiSuccess {String} surveyType The type of the survey, either "QUESTIONNAIRE" or "FEEDBACK"
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.questions Link to the questions on the survey
 */
export class SurveyHateoas extends SimpleHateoas<Survey> {
  public referenceFields: (keyof Survey)[] = [];
  public data: Survey;

  public constructor(data: Survey) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: toIdUrl(this.data.name, Prefix.survey),
      questions: toQuestionIdUrl(this.data.name, ""),
    };
  }
}

export const surveyPostSchema = z.object({
  name: z.string(),
  surveyType: z.enum([SurveyType.FEEDBACK, SurveyType.QUESTIONNAIRE]),
  language: z
    .string()
    .refine((str) => isLocale(str), "Language provided is not valid"),
});

/**
 * @apiDefine SurveyPostBody
 * @apiBody {String} name The name of the survey
 * @apiBody {String} surveyType The type of the survey, either "QUESTIONNAIRE" or "FEEDBACK"
 * @apiBody {String} language The language of the survey, e.g. "en"
 */
export type SurveyPost = z.infer<typeof surveyPostSchema>;

/**
 * @apiDefine SubmittedSurveySuccess
 * @apiUse Hateoas
 * @apiSuccess {String} day The day the survey was submitted
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.child Link to the child the survey was submitted for
 * @apiSuccess {String} _links.survey Link to the survey that was submitted
 */
export class SubmittedSurveyHateoas extends SimpleHateoas<SubmittedSurvey> {
  public referenceFields: (keyof SubmittedSurvey)[] = ["childId", "surveyName"];
  public data: SubmittedSurvey;

  public constructor(data: SubmittedSurvey) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: toSubmittedSurveyIdUrl(this.data.childId, this.data.id),
      child: toIdUrl(this.data.childId, Prefix.child),
      survey: toIdUrl(this.data.surveyName, Prefix.survey),
      answers: toSubmittedSurveyAnswerIdUrl(
        this.data.childId,
        this.data.id,
        ""
      ),
      postSettings: new UrlBuilder()
        .addPrefix(Prefix.postResultedSettings, {
          childId: this.data.childId,
          submittedSurveyId: this.data.id,
        })
        .toCompleteAPIPath(),
    };
  }
}

export const submittedSurveyPostSchema = z.object({
  surveyUrl: z.string(),
});

/**
 * @apiDefine SubmittedSurveyPostBody
 * @apiBody {String} surveyUrl The url of the survey that was submitted
 */
export type SubmittedSurveyPost = z.infer<typeof submittedSurveyPostSchema>;

/**
 * @apiDefine SubmittedSurveyAnswerSuccess
 * @apiUse Hateoas
 * @apiSuccess {String} openAnswer The open answer to the question if any
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.submittedSurvey Link to the submitted survey the answer belongs to
 * @apiSuccess {String} _links.answerOption Link to the answer option the answer belongs to
 */
export class SubmittedSurveyAnswerHateoas extends SimpleHateoas<SubmittedSurveyAnswer> {
  public referenceFields: (keyof SubmittedSurveyAnswer)[] = [
    "answerOptionId",
    "submittedSurveyId",
  ];
  public data: SubmittedSurveyAnswer;

  public constructor(
    data: SubmittedSurveyAnswer,
    private childId: string,
    private surveyName: string,
    private questionId: string
  ) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: toSubmittedSurveyAnswerIdUrl(
        this.childId,
        this.data.submittedSurveyId,
        this.data.answerOptionId
      ),
      submittedSurvey: toSubmittedSurveyIdUrl(
        this.childId,
        this.data.submittedSurveyId
      ),
      answerOption: toAnswerOptionIdUrl(
        this.surveyName,
        this.questionId,
        this.data.answerOptionId
      ),
    };
  }
}

export const submittedSurveyAnswerPostSchema = z.object({
  answerOptionUrl: z.string(),
  openAnswer: z.string().optional(),
});

/**
 * @apiDefine SubmittedSurveyAnswerPostBody
 * @apiBody {String} answerOptionUrl The url of the answer option that was selected
 * @apiBody {String} [openAnswer] The open answer that was given
 */
export type SubmittedSurveyAnswerPost = z.infer<
  typeof submittedSurveyAnswerPostSchema
>;
