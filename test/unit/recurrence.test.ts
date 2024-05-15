import {
  ActivityRecurrence,
  RecurrenceEnds,
  RecurrenceFrequency,
  RecurrenceStep,
} from "../../src/types/express/activity";
import {
  firstDayOfWeek,
  recurrenceToDates,
  shiftDate,
} from "../../src/util/parser";
import { MAX_ACTIVITIES } from "../../src/util/consts";

describe("recurrenceToDates", () => {
  it("should handle DAILY recurrence NEVER ending", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.daily,
      ends: RecurrenceEnds.never,
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(MAX_ACTIVITIES);
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[MAX_ACTIVITIES - 1].toISOString().slice(0, 10)).toEqual(
      "2023-08-08"
    );
  });

  it("should handle DAILY recurrence ending ON a specific date", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.daily,
      ends: RecurrenceEnds.on,
      until: new Date("2023-05-05"),
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(5); // five days from 05-01 to 05-05 inclusive
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[4].toISOString().slice(0, 10)).toEqual("2023-05-05");
  });

  it("should handle DAILY recurrence ending AFTER a certain number of times", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.daily,
      ends: RecurrenceEnds.after,
      times: 3,
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(3); // three weeks from start date
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[2].toISOString().slice(0, 10)).toEqual("2023-05-03");
  });

  it("should handle WEEKLY recurrence NEVER ending", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.weekly,
      ends: RecurrenceEnds.never,
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(MAX_ACTIVITIES);
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[MAX_ACTIVITIES - 1].toISOString().slice(0, 10)).toEqual(
      "2025-03-24"
    );
  });

  it("should handle WEEKLY recurrence ending ON a specific date", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.weekly,
      ends: RecurrenceEnds.on,
      until: new Date("2023-05-31"),
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    const expectedLength = 5;

    expect(dates).toHaveLength(5); // six weeks from 05-01 to 05-31 inclusive
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[expectedLength - 1].toISOString().slice(0, 10)).toEqual(
      "2023-05-29"
    );
  });

  it("should handle WEEKLY recurrence ending AFTER a certain number of times", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.weekly,
      ends: RecurrenceEnds.after,
      times: 3,
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(3); // three weeks from start date
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[2].toISOString().slice(0, 10)).toEqual("2023-05-15");
  });

  it("should handle MONTHLY recurrence NEVER ending", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.monthly,
      ends: RecurrenceEnds.never,
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(MAX_ACTIVITIES);
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[MAX_ACTIVITIES - 1].toISOString().slice(0, 10)).toEqual(
      "2031-08-01"
    );
  });

  it("should handle MONTHLY recurrence ending ON a specific date", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.monthly,
      ends: RecurrenceEnds.on,
      until: new Date("2023-09-01"),
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    const expectedLength = 5;

    expect(dates).toHaveLength(5); // six weeks from 05-01 to 05-31 inclusive
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[expectedLength - 1].toISOString().slice(0, 10)).toEqual(
      "2023-09-01"
    );
  });

  it("should handle MONTHLY recurrence ending AFTER a certain number of times", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.monthly,
      ends: RecurrenceEnds.after,
      times: 3,
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(3); // three weeks from start date
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[2].toISOString().slice(0, 10)).toEqual("2023-07-01");
  });

  it("should handle YEARLY recurrence NEVER ending", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.yearly,
      ends: RecurrenceEnds.never,
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(MAX_ACTIVITIES);
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[MAX_ACTIVITIES - 1].toISOString().slice(0, 10)).toEqual(
      "2122-05-01"
    );
  });

  it("should handle YEARLY recurrence ending ON a specific date", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.yearly,
      ends: RecurrenceEnds.on,
      until: new Date("2027-05-01"),
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    const expectedLength = 5;

    expect(dates).toHaveLength(5); // six weeks from 05-01 to 05-31 inclusive
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[expectedLength - 1].toISOString().slice(0, 10)).toEqual(
      "2027-05-01"
    );
  });

  it("should handle YEARLY recurrence ending AFTER a certain number of times", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.yearly,
      ends: RecurrenceEnds.after,
      times: 3,
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(3); // three weeks from start date
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[2].toISOString().slice(0, 10)).toEqual("2025-05-01");
  });

  it("should handle CUSTOM WEEKLY recurrence with specific days NEVER ending", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.custom,
      ends: RecurrenceEnds.never,
      step: RecurrenceStep.week,
      interval: 1,
      days: [false, true, true, false, false, false, false], // only Tuesday and Wednesday
    };

    const startDate = new Date("2023-05-01"); // This is a Monday
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(MAX_ACTIVITIES);
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-02");
    expect(dates[MAX_ACTIVITIES - 1].toISOString().slice(0, 10)).toEqual(
      "2024-04-10"
    );
  });

  it("should handle CUSTOM DAILY recurrence ending AFTER a certain number of times", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.custom,
      ends: RecurrenceEnds.after,
      times: 3,
      step: RecurrenceStep.day,
      interval: 2, // every other day
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(3);
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[1].toISOString().slice(0, 10)).toEqual("2023-05-03");
    expect(dates[2].toISOString().slice(0, 10)).toEqual("2023-05-05");
  });

  it("should handle CUSTOM MONTHLY recurrence ending ON a specific date", () => {
    const recurrence: ActivityRecurrence = {
      frequency: RecurrenceFrequency.custom,
      ends: RecurrenceEnds.on,
      until: new Date("2023-08-01"),
      step: RecurrenceStep.month,
      interval: 2, // every other month
    };

    const startDate = new Date("2023-05-01");
    const dates = recurrenceToDates(recurrence, startDate);

    expect(dates).toHaveLength(2); // May and July
    expect(dates[0].toISOString().slice(0, 10)).toEqual("2023-05-01");
    expect(dates[1].toISOString().slice(0, 10)).toEqual("2023-07-01");
  });
});

describe("shiftDate", () => {
  it("should shift date by one day", () => {
    const date = new Date("2023-01-01");
    const newDate = shiftDate(date, 1, RecurrenceStep.day);
    const newDate2 = shiftDate(date, 1, RecurrenceFrequency.daily);

    const expectedDate = new Date("2023-01-02");

    expect(newDate).toEqual(expectedDate);
    expect(newDate2).toEqual(expectedDate);
  });

  it("should shift date by one week", () => {
    const date = new Date("2023-01-01");
    const newDate = shiftDate(date, 1, RecurrenceStep.week);
    const newDate2 = shiftDate(date, 1, RecurrenceFrequency.weekly);

    const expectedDate = new Date("2023-01-08");

    expect(newDate).toEqual(expectedDate);
    expect(newDate2).toEqual(expectedDate);
  });

  it("should shift date by one month", () => {
    const date = new Date("2023-01-01");
    const newDate = shiftDate(date, 1, RecurrenceStep.month);
    const newDate2 = shiftDate(date, 1, RecurrenceFrequency.monthly);

    const expectedDate = new Date("2023-02-01");

    expect(newDate).toEqual(expectedDate);
    expect(newDate2).toEqual(expectedDate);
  });

  it("should shift date by one year", () => {
    const date = new Date("2023-01-01");
    const newDate = shiftDate(date, 1, RecurrenceStep.year);
    const newDate2 = shiftDate(date, 1, RecurrenceFrequency.yearly);

    const expectedDate = new Date("2024-01-01");

    expect(newDate).toEqual(expectedDate);
    expect(newDate2).toEqual(expectedDate);
  });
  it("should not shift date when delta is zero", () => {
    const date = new Date("2023-01-01");
    const newDate = shiftDate(date, 0, RecurrenceStep.day);

    expect(newDate).toEqual(date);
  });

  it("should shift date backwards by one day when delta is negative", () => {
    const date = new Date("2023-01-02");
    const newDate = shiftDate(date, -1, RecurrenceStep.day);

    const expectedDate = new Date("2023-01-01");

    expect(newDate).toEqual(expectedDate);
  });

  it("should correctly handle leap years when shifting by one year", () => {
    const date = new Date("2023-02-28");
    const newDate = shiftDate(date, 1, RecurrenceStep.year);

    const expectedDate = new Date("2024-02-28");

    expect(newDate).toEqual(expectedDate);
  });

  it("should correctly handle shift from leap year to non-leap year", () => {
    const date = new Date("2024-02-29");
    const newDate = shiftDate(date, 1, RecurrenceStep.year);

    const expectedDate = new Date("2025-03-01");

    expect(newDate).toEqual(expectedDate);
  });

  it("should shift date by 10 days", () => {
    const date = new Date("2023-01-01");
    const newDate = shiftDate(date, 10, RecurrenceStep.day);

    const expectedDate = new Date("2023-01-11");

    expect(newDate).toEqual(expectedDate);
  });

  it("should shift date by 5 weeks", () => {
    const date = new Date("2023-01-01");
    const newDate = shiftDate(date, 5, RecurrenceStep.week);

    const expectedDate = new Date("2023-02-05");

    expect(newDate).toEqual(expectedDate);
  });

  it("should shift date by 11 months", () => {
    const date = new Date("2023-01-01");
    const newDate = shiftDate(date, 11, RecurrenceStep.month);

    const expectedDate = new Date("2023-12-01");

    expect(newDate).toEqual(expectedDate);
  });

  it("should shift date by 3 years", () => {
    const date = new Date("2023-01-01");
    const newDate = shiftDate(date, 3, RecurrenceStep.year);

    const expectedDate = new Date("2026-01-01");

    expect(newDate).toEqual(expectedDate);
  });
});

describe("firstDayOfWeek", () => {
  it("should return the same date for a Monday", () => {
    const date = new Date("2023-05-01"); // May 1, 2023 is a Monday
    const newDate = firstDayOfWeek(date);

    expect(newDate.toISOString().slice(0, 10)).toEqual("2023-05-01");
  });

  it("should return the previous Monday for a Tuesday", () => {
    const date = new Date("2023-05-02"); // May 2, 2023 is a Tuesday
    const newDate = firstDayOfWeek(date);

    expect(newDate.toISOString().slice(0, 10)).toEqual("2023-05-01");
  });

  it("should return the previous Monday for a Sunday", () => {
    const date = new Date("2023-05-07"); // May 7, 2023 is a Sunday
    const newDate = firstDayOfWeek(date);

    expect(newDate.toISOString().slice(0, 10)).toEqual("2023-05-01");
  });

  it("should return the previous Monday for a day in the next month", () => {
    const date = new Date("2023-06-01"); // May 7, 2023 is a Sunday
    const newDate = firstDayOfWeek(date);

    expect(newDate.toISOString().slice(0, 10)).toEqual("2023-05-29");
  });
});
