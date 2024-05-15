export enum HttpHeader {
  auth = "Authorization",
}

export enum Status {
  ok = 200,
  created = 201,
  noContent = 204,
  found = 302,
  badRequest = 400,
  forbidden = 403,
  notFound = 404,
  conflict = 409,
  unauthorized = 401,
  internalServerError = 500,
}

// !!! This enum and the Prefix enum need to be in sync !!!
export enum PrefixBlocks {
  survey = "surveys",
  question = "questions",
  answerOption = "answerOptions",
  account = "account",
  externalCalendar = "externalCalendars",
  child = "children",
  ical = "ical",
  activity = "activities",
  task = "tasks",
  taskProgress = "progresses",
  template = "templates",
  clarificationImage = "clarificationImages",
  submittedSurvey = "submittedSurveys",
  submittedSurveyAnswer = "submittedSurveyAnswers",
  postResultedSettings = "postResultedSettings",
}

// !!! This enum and the PrefixBlocks enum need to be in sync !!!
export enum Prefix {
  home = "/",

  survey = "/surveys",
  question = "/surveys/:surveyName/questions",
  answerOption = "/surveys/:surveyName/questions/:questionId/answerOptions",
  submittedSurvey = "/children/:childId/submittedSurveys",
  submittedSurveyAnswer = "/children/:childId/submittedSurveys/:submittedSurveyId/submittedSurveyAnswers",
  postResultedSettings = "/children/:childId/submittedSurveys/:submittedSurveyId/postResultedSettings",

  child = "/children",

  account = "/account",

  externalCalendar = "/account/:accountId/externalCalendars",

  ical = "/children/:childId/ical",
  activity = "/children/:childId/activities",
  template = "/children/:childId/templates",
  task = "/children/:childId/templates/:templateId/tasks",
  taskProgress = "/children/:childId/activities/:activityId/progresses",
  clarificationImage = "/children/:childId/clarificationImages",
}

export const MAX_ACTIVITIES = 100;
export const DAYS_IN_WEEK = 7;
export const MONTHS_IN_YEAR = 12;
