import { SurveyType } from "@prisma/client";
import {
  AnswerOptionPost,
  QuestionPost,
  SubmittedSurveyAnswerPost,
  SubmittedSurveyPost,
  SurveyPost,
} from "../../../src/types/express/profile";
import {
  ExternalCalendarPost,
  GuardianPost,
} from "../../../src/types/express/account";
import { ChildPost } from "../../../src/types/express/child";
import { getEnv } from "../../../src/util/dotEnvHandling";
import { Prefix, PrefixBlocks } from "../../../src/util/consts";
import {
  ActivityPost,
  ClarificationImagePost,
  RecurrenceEnds,
  RecurrenceFrequency,
  TaskPost,
  TemplatePost,
} from "../../../src/types/express/activity";
import { UrlBuilder } from "../../../src/util/urlBuilder";

export function basicQuestionPost(
  startValue?: Partial<QuestionPost>
): QuestionPost {
  return {
    title: startValue?.title ?? "title",
    description: startValue?.description ?? "description",
    referenceNumber: startValue?.referenceNumber ?? 1,
  };
}

export function basicAnswerOptionPost(
  startValue?: Partial<AnswerOptionPost>
): AnswerOptionPost {
  return {
    answer: startValue?.answer ?? "answer",
    options: startValue?.options ?? undefined,
    referenceNumber: startValue?.referenceNumber ?? 1,
    partialSettings: startValue?.partialSettings ?? {},
  };
}

export function basicSurveyPost(startValue?: Partial<SurveyPost>): SurveyPost {
  return {
    name: startValue?.name ?? "The survey of your life",
    surveyType: startValue?.surveyType ?? SurveyType.QUESTIONNAIRE,
    language: startValue?.language ?? "en",
  };
}

export function basicSubmittedSurveyPost(
  startValue?: Partial<SubmittedSurveyPost>
): SubmittedSurveyPost {
  return {
    surveyUrl:
      startValue?.surveyUrl ?? `${getEnv().HOST}/${PrefixBlocks.survey}/1`,
  };
}

export function basicSubmittedSurveyAnswerPost(
  startValue?: Partial<SubmittedSurveyAnswerPost>
): SubmittedSurveyAnswerPost {
  return {
    answerOptionUrl:
      startValue?.answerOptionUrl ??
      `${getEnv().HOST}/${PrefixBlocks.survey}/appleOrPear/${
        PrefixBlocks.question
      }/1/${PrefixBlocks.answerOption}/1`,
    openAnswer: startValue?.openAnswer ?? "openAnswer",
  };
}

export function basicGuardianPost(
  startValue?: Partial<GuardianPost>
): GuardianPost {
  return {
    name: startValue?.name ?? "Alfred",
  };
}

export function basicChildPost(startValue?: Partial<ChildPost>): ChildPost {
  return {
    name: startValue?.name ?? "Bobbie",
    settings: {},
  };
}

export function basicExternalCalendarPost(
  startValue?: Partial<ExternalCalendarPost>
): ExternalCalendarPost {
  return {
    name: startValue?.name ?? "Holidays",
    url:
      startValue?.url ??
      "https://www.webcal.guru/en-US/download_calendar?calendar_instance_id=220",
    color: startValue?.color ?? "#316a9b",
  };
}

export function basicActivityPost(
  startValue?: Partial<ActivityPost>
): ActivityPost {
  return {
    start: startValue?.start ?? new Date(),
    templateUrl:
      startValue?.templateUrl ??
      new UrlBuilder()
        .addPrefix(Prefix.template, {
          childId: "1",
        })
        .addId("1")
        .toCompleteAPIPath(),
    recurrence: startValue?.recurrence ?? {
      frequency: RecurrenceFrequency.none,
      ends: RecurrenceEnds.never,
    },
  };
}

export function basicTaskPost(startValue?: Partial<TaskPost>): TaskPost {
  return {
    duration: startValue?.duration ?? 120,
    description: startValue?.description ?? "",
    summary: startValue?.summary ?? "",
    referenceNumber: startValue?.referenceNumber ?? 1,
    imageUrl: startValue?.imageUrl ?? undefined,
  };
}

export function basicTemplatePost(
  startValue?: Partial<TemplatePost>
): TemplatePost {
  return {
    duration: startValue?.duration ?? 120,
    description: startValue?.description ?? "",
    summary: startValue?.summary ?? "",
    visible: startValue?.visible ?? true,
    overlapability: startValue?.overlapability ?? "DEFAULT",
    hasTimer: startValue?.hasTimer ?? true,
  };
}

export function basicClarificationImagePost(
  startValue?: Partial<ClarificationImagePost>
): ClarificationImagePost {
  return {
    name: startValue?.name ?? "clarificationImage",
    reference:
      startValue?.reference ??
      new UrlBuilder().addId("static").addId("icon.png").toCompleteAPIPath(),
  };
}
