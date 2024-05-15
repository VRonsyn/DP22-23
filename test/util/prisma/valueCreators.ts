import {
  Activity,
  AnswerOption,
  Child,
  ChildAccessRelation,
  ChildAnimationAmount,
  ChildColor,
  ChildHomeScreen,
  ChildLanguage,
  ChildSettings,
  ChildShowPastActivities,
  ChildTextAmount,
  ChildTime,
  ClarificationImage,
  ExternalCalendar,
  Guardian,
  GuardianPermission,
  Question,
  ServerRole,
  SubmittedSurvey,
  SubmittedSurveyAnswer,
  Survey,
  SurveyType,
  Task,
  TaskProgress,
  Template,
} from "@prisma/client";

export function basicQuestion(startValue?: Partial<Question>): Question {
  return {
    id: startValue?.id ?? "1",
    referenceNumber: startValue?.referenceNumber ?? 1,
    title: startValue?.title ?? "title",
    description: startValue?.description ?? ["description"],
    surveyName: startValue?.surveyName ?? "surveyName",
  };
}

export function basicAnswerOption(
  startValue?: Partial<AnswerOption>
): AnswerOption {
  return {
    id: startValue?.id ?? "1",
    questionId: startValue?.questionId ?? "1",
    referenceNumber: startValue?.referenceNumber ?? 1,
    answer: startValue?.answer ?? "answer",
    options: startValue?.options ?? null,
    partialSettings: startValue?.partialSettings ?? {},
  };
}

export function basicSurvey(startValue?: Partial<Survey>): Survey {
  return {
    name: startValue?.name ?? "name",
    creationTime: startValue?.creationTime ?? new Date(),
    surveyType: startValue?.surveyType ?? SurveyType.QUESTIONNAIRE,
    language: startValue?.language ?? "en",
  };
}

export function basicGuardian(startValue?: Partial<Guardian>): Guardian {
  return {
    id: startValue?.id ?? "1",
    name: startValue?.name ?? "name",
    // IMPORTANT: This should by default, not be our valid test auth id with which we send test requests!
    auth0Id: startValue?.auth0Id ?? "auth0Id",
    serverRole: startValue?.serverRole ?? ServerRole.GUARDIAN,
    picture: null,
  };
}

export function basicChildAccessRelation(
  startValue?: Partial<ChildAccessRelation>
): ChildAccessRelation {
  return {
    permission: startValue?.permission ?? GuardianPermission.ADMIN,
    childId: startValue?.childId ?? "1",
    guardianId: startValue?.guardianId ?? "1",
  };
}

export function basicChild(startValue?: Partial<Child>): Child {
  return {
    id: startValue?.id ?? "1",
    name: startValue?.name ?? "name",
    settingsId: startValue?.settingsId ?? "1",
  };
}

export function basicChildSettings(
  startValue?: Partial<ChildSettings>
): ChildSettings {
  return {
    id: startValue?.id ?? "1",

    time: startValue?.time ?? ChildTime.VISUAL,
    language: startValue?.language ?? ChildLanguage.DUTCH,
    textAmount: startValue?.textAmount ?? ChildTextAmount.ALL,
    animationAmount: startValue?.animationAmount ?? ChildAnimationAmount.ALL,
    homeScreen: startValue?.homeScreen ?? ChildHomeScreen.DAY,
    showPastActivities:
      startValue?.showPastActivities ?? ChildShowPastActivities.PARTIAL,
    emergencyNumber: startValue?.emergencyNumber ?? "112",

    canViewDayOverview: startValue?.canViewDayOverview ?? true,
    canViewWeekOverview: startValue?.canViewWeekOverview ?? true,

    primaryColor: startValue?.primaryColor ?? ChildColor.GREY,
    mondayColor: startValue?.mondayColor ?? ChildColor.GREY,
    tuesdayColor: startValue?.tuesdayColor ?? ChildColor.GREY,
    wednesdayColor: startValue?.wednesdayColor ?? ChildColor.GREY,
    thursdayColor: startValue?.thursdayColor ?? ChildColor.GREY,
    fridayColor: startValue?.fridayColor ?? ChildColor.GREY,
    saturdayColor: startValue?.saturdayColor ?? ChildColor.GREY,
    sundayColor: startValue?.sundayColor ?? ChildColor.GREY,

    paletteFirst: startValue?.paletteFirst ?? ChildColor.GREY,
    paletteSecond: startValue?.paletteSecond ?? ChildColor.GREY,
    paletteThird: startValue?.paletteThird ?? ChildColor.GREY,
    paletteFourth: startValue?.paletteFourth ?? ChildColor.GREY,
    paletteFifth: startValue?.paletteFifth ?? ChildColor.GREY,
    paletteSixth: startValue?.paletteSixth ?? ChildColor.GREY,
    paletteSeventh: startValue?.paletteSeventh ?? ChildColor.GREY,
  };
}

export function basicSubmittedSurvey(
  startValue?: Partial<SubmittedSurvey>
): SubmittedSurvey {
  return {
    id: startValue?.id ?? "1",
    surveyName: startValue?.surveyName ?? "surveyName",
    childId: startValue?.childId ?? "1",
    day: startValue?.day ?? new Date(),
  };
}

export function basicSubmittedSurveyAnswer(
  startValue?: Partial<SubmittedSurveyAnswer>
): SubmittedSurveyAnswer {
  return {
    id: startValue?.id ?? "1",
    answerOptionId: startValue?.answerOptionId ?? "1",
    submittedSurveyId: startValue?.submittedSurveyId ?? "1",
    openAnswer: startValue?.openAnswer ?? null,
  };
}

export function basicExternalCalendar(
  startValue?: Partial<ExternalCalendar>
): ExternalCalendar {
  return {
    id: startValue?.id ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
    name: startValue?.name ?? "Holidays",
    url:
      startValue?.url ??
      "https://www.webcal.guru/en-US/download_calendar?calendar_instance_id=220",
    color: startValue?.color ?? "#316a9b",
    guardianId:
      startValue?.guardianId ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
  };
}

export function basicActivity(startValue?: Partial<Activity>): Activity {
  return {
    id: startValue?.id ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
    start: startValue?.start ?? new Date(),

    done: startValue?.done ?? false,
    emotion: startValue?.emotion ?? null,
    unclear: startValue?.unclear ?? false,

    templateId:
      startValue?.templateId ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
    childId: startValue?.childId ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
  };
}

export function basicTask(startValue?: Partial<Task>): Task {
  return {
    id: startValue?.id ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
    templateId:
      startValue?.templateId ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
    description: startValue?.description ?? "",
    summary: startValue?.summary ?? "",
    duration: startValue?.duration ?? 120,
    referenceNumber: startValue?.referenceNumber ?? 1,
    imageId: startValue?.imageId ?? null,
  };
}

export function basicTemplate(startValue?: Partial<Template>): Template {
  return {
    id: startValue?.id ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
    childId: startValue?.childId ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
    description: startValue?.description ?? "",
    summary: startValue?.summary ?? "",
    duration: startValue?.duration ?? 120,
    visible: startValue?.visible ?? true,
    geoLon: startValue?.geoLon ?? null,
    geoLat: startValue?.geoLat ?? null,
    location: startValue?.location ?? null,
    overlapability: startValue?.overlapability ?? "DEFAULT",

    imageId: startValue?.imageId ?? null,
    hasTimer: startValue?.hasTimer ?? false,
  };
}

export function basicClarificationImage(
  startValue?: Partial<ClarificationImage>
): ClarificationImage {
  return {
    id: startValue?.id ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
    childId: startValue?.childId ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
    name: startValue?.name ?? "name",
    reference: startValue?.reference ?? "reference",
  };
}

export function basicTaskProgress(
  startValue?: Partial<TaskProgress>
): TaskProgress {
  return {
    taskId: startValue?.taskId ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",
    activityId:
      startValue?.activityId ?? "ad37ce4e-623e-437a-95e2-dd2e5133ce74",

    done: startValue?.done ?? false,
    unclear: startValue?.unclear ?? false,
  };
}
