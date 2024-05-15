import { IdUrlParseError } from "./errors";
import { getEnv } from "./dotEnvHandling";
import { DAYS_IN_WEEK, MAX_ACTIVITIES, MONTHS_IN_YEAR, Prefix } from "./consts";
import {
  ActivityRecurrence,
  RecurrenceEnds,
  RecurrenceFrequency,
  RecurrenceStep,
} from "../types/express/activity";
import { logger } from "./logger";

export function parseAbsolutePath<T extends string>(
  path: string,
  patchMatcher: string,
  parseKeys: T[],
  errorCreator = () =>
    new Error(`Path "${path}" can not be parsed with prefix "${patchMatcher}"`)
): { [key in T]: string } {
  let matcher = patchMatcher;
  let replacer = "";
  for (const [index, key] of parseKeys.entries()) {
    matcher = matcher.replace(`:${key}`, `([^/]*)`);
    // eslint-disable-next-line
    replacer += `${replacer ? "!" : ""}$${index + 1}`;
  }
  matcher = matcher.replace(/:[a-zA-Z]+/gu, "[^/]*");
  const decodedPath = decodeURI(path);

  const match = decodedPath
    .replace(new RegExp(`^${matcher}/?$`, "ug"), replacer)
    .split("!");

  if (match.length !== parseKeys.length) {
    throw errorCreator();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  for (const [index, key] of parseKeys.entries()) {
    result[key] = match[index];
  }
  return result;
}

export function parseRelativePath<T extends string>(
  path: string,
  prefix: string,
  parseKeys: T[],
  errorCreator?: () => Error
): { [key in T]: string } {
  return parseAbsolutePath(
    path,
    `${getEnv().HOST}${prefix}`,
    parseKeys,
    errorCreator
  );
}

export function parseRelativePathSafe<T extends string>(
  path: string,
  prefix: string,
  parseKeys: T[]
): { [key in T]: string } {
  return parseAbsolutePath(
    path,
    `${getEnv().HOST}${prefix}`,
    parseKeys,
    () => new IdUrlParseError(path, prefix)
  );
}

export function idURLToSurveyName(idURL: string): string {
  const res = parseRelativePathSafe(idURL, `${Prefix.survey}/:surveyName`, [
    "surveyName",
  ]);
  return res.surveyName;
}

export function idURLToAnswerOptionFields(idURL: string): string {
  return parseRelativePathSafe(
    idURL,
    `${Prefix.answerOption}/:answerOptionId`,
    ["answerOptionId"]
  ).answerOptionId;
}

export function idURLToQuestionId(idURL: string): string {
  return parseRelativePath(
    idURL,
    `${Prefix.question}/:questionId`,
    ["questionId"],
    () => new IdUrlParseError(idURL, "Question")
  ).questionId;
}

export function idURLToAccountId(idURL: string): string {
  return parseRelativePath(
    idURL,
    `${Prefix.account}/:accountId`,
    ["accountId"],
    () => new IdUrlParseError(idURL, "Account")
  ).accountId;
}

export function idURLToTemplateId(idURL: string): string {
  return parseRelativePath(
    idURL,
    `${Prefix.template}/:templateId`,
    ["templateId"],
    () => new IdUrlParseError(idURL, "Template")
  ).templateId;
}

export function idUrlToClarificationImageId(idURL: string): string {
  return parseRelativePath(
    idURL,
    `${Prefix.clarificationImage}/:clarificationImageId`,
    ["clarificationImageId"],
    () => new IdUrlParseError(idURL, "ClarificationImage")
  ).clarificationImageId;
}

export function idUrlToTaskId(idURL: string): string {
  return parseRelativePath(
    idURL,
    `${Prefix.task}/:taskId`,
    ["taskId"],
    () => new IdUrlParseError(idURL, "Task")
  ).taskId;
}

export function recurrenceToDates(
  recurrence: ActivityRecurrence,
  startDate: Date
) {
  const dates = [];
  let max = MAX_ACTIVITIES;

  if (recurrence.frequency === RecurrenceFrequency.none) {
    return [startDate];
  }

  if (recurrence.ends === RecurrenceEnds.after) {
    max = recurrence.times;
  }
  let date = startDate;
  let index = 0;

  if (
    recurrence.frequency === "CUSTOM" &&
    recurrence.step === RecurrenceStep.week
  ) {
    const startMonday = firstDayOfWeek(startDate);

    while (
      (index < max &&
        dates.length < max &&
        recurrence.ends !== RecurrenceEnds.on) ||
      (index < max &&
        dates.length <= max &&
        recurrence.ends === RecurrenceEnds.on &&
        date < recurrence.until)
    ) {
      date = shiftDate(
        startMonday,
        recurrence.interval * index,
        recurrence.step
      );

      for (let i = 0; i < DAYS_IN_WEEK; i++) {
        const newDate = shiftDate(date, i, RecurrenceStep.day);

        if (recurrence.days[i] && newDate > startDate && dates.length < max) {
          dates.push(newDate);
          logger.debug(`Added date ${newDate}`);
        }
      }
      index += 1;
    }
  } else {
    const interval =
      recurrence.frequency === "CUSTOM" ? recurrence.interval : 1;

    while (
      (index < max && recurrence.ends !== RecurrenceEnds.on) ||
      (index < max &&
        recurrence.ends === RecurrenceEnds.on &&
        date < recurrence.until)
    ) {
      date = shiftDate(
        startDate,
        index * interval,
        recurrence.frequency === "CUSTOM"
          ? recurrence.step
          : recurrence.frequency
      );
      if (
        recurrence.ends !== RecurrenceEnds.on ||
        (recurrence.ends === RecurrenceEnds.on && date <= recurrence.until)
      ) {
        dates.push(date);
      }
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      index += 1;
    }
  }
  return dates;
}

export function shiftDate(
  date: Date,
  delta: number,
  step: RecurrenceFrequency | RecurrenceStep
) {
  const newDate = new Date(date);
  switch (step) {
    case RecurrenceFrequency.daily:
    case RecurrenceStep.day:
      newDate.setDate(date.getDate() + delta);
      break;
    case RecurrenceFrequency.weekly:
    case RecurrenceStep.week:
      newDate.setDate(date.getDate() + delta * DAYS_IN_WEEK);
      break;
    case RecurrenceFrequency.monthly:
    case RecurrenceStep.month:
      newDate.setMonth((date.getMonth() + delta) % MONTHS_IN_YEAR);
      newDate.setFullYear(
        date.getFullYear() + (date.getMonth() + delta) / MONTHS_IN_YEAR
      );
      break;
    case RecurrenceFrequency.yearly:
    case RecurrenceStep.year:
      newDate.setFullYear(date.getFullYear() + delta);
      break;
  }
  return newDate;
}

export function firstDayOfWeek(date: Date) {
  const day = date.getDay();
  // calculate the difference between the current day and the beginning of the week, special case for Sunday
  const diff = date.getDate() - (day === 0 ? DAYS_IN_WEEK - 1 : day - 1);
  return new Date(date.setDate(diff));
}
