import { getEnv } from "./dotEnvHandling";
import { Prefix, PrefixBlocks } from "./consts";

export function toCompleteAPIPath(path: string): string {
  return encodeURI(`${getEnv().HOST}${path}`);
}

export function toQuestionIdUrl(
  surveyName: string,
  questionId: string
): string {
  return toCompleteAPIPath(
    `/${PrefixBlocks.survey}/${surveyName}/${PrefixBlocks.question}/${questionId}`
  );
}

export function toAnswerOptionIdUrl(
  surveyName: string,
  questionId: string,
  answerOptionId: string
): string {
  return toCompleteAPIPath(
    `/${PrefixBlocks.survey}/${surveyName}/${PrefixBlocks.question}/${questionId}/${PrefixBlocks.answerOption}/${answerOptionId}`
  );
}

export function toIdUrl(id: string, prefix: Prefix) {
  return toCompleteAPIPath(`${prefix}/${id}`);
}

export function toActivityIdUrl(childId: string, activityId: string) {
  return toCompleteAPIPath(
    `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.activity}/${activityId}`
  );
}

export function toTaskIdUrl(
  childId: string,
  templateId: string,
  taskId: string
) {
  return toCompleteAPIPath(
    `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.template}/${templateId}/${PrefixBlocks.task}/${taskId}`
  );
}

export function toTaskProgressIdUrl(
  childId: string,
  activityId: string,
  taskId: string
) {
  return toCompleteAPIPath(
    `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.activity}/${activityId}/${PrefixBlocks.taskProgress}/${taskId}`
  );
}

export function toTemplateIdUrl(childId: string, templateId: string) {
  return toCompleteAPIPath(
    `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.template}/${templateId}`
  );
}

export function toSubmittedSurveyIdUrl(
  childId: string,
  submittedSurveyId: string
) {
  return toCompleteAPIPath(
    `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.submittedSurvey}/${submittedSurveyId}`
  );
}

export function toSubmittedSurveyAnswerIdUrl(
  childId: string,
  submittedSurveyId: string,
  submittedSurveyAnswerId: string
) {
  return toCompleteAPIPath(
    `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.submittedSurvey}/${submittedSurveyId}/${PrefixBlocks.submittedSurveyAnswer}/${submittedSurveyAnswerId}`
  );
}

export function toExternalCalendarIdUrl(
  accountId: string,
  externalCalendarId: string
) {
  return toCompleteAPIPath(
    `/${PrefixBlocks.account}/${accountId}/${PrefixBlocks.externalCalendar}/${externalCalendarId}`
  );
}
