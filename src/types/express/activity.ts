import {
  Activity,
  ClarificationImage,
  Emotion,
  Overlapability,
  Task,
  TaskProgress,
  Template,
} from "@prisma/client";
import { z } from "zod";
import { DAYS_IN_WEEK, Prefix } from "../../util/consts";
import { UrlBuilder } from "../../util/urlBuilder";
import { SimpleHateoas } from "./hateoas";

export enum RecurrenceFrequency {
  daily = "DAILY",
  weekly = "WEEKLY",
  monthly = "MONTHLY",
  yearly = "YEARLY",
  custom = "CUSTOM",
  none = "NONE",
}

export enum RecurrenceStep {
  day = "DAY",
  week = "WEEK",
  month = "MONTH",
  year = "YEAR",
}

export enum RecurrenceEnds {
  never = "NEVER",
  on = "ON",
  after = "AFTER",
}

/**
 * @apiDefine ActivityRecurrence
 * @apiParam {String} frequency The frequency of the recurrence (NEVER, DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM)
 * @apiParam {String} step The step of the recurrence (DAY, WEEK, MONTH, YEAR)
 * @apiParam {Number} interval The interval between the recurrences
 * @apiParam {Boolean[]} days The days of the week on which the activity recurs, only applicable if step == "WEEK" (length 7)
 * @apiParam {String} ends The end of the recurrence (NEVER, ON, AFTER)
 * @apiParam {Date} [until] The date until which the activity recurs, required if ends == "ON"
 * @apiParam {Number} [times] The number of times the activity recurs, required if ends == "AFTER"
 */
export const activityRecurrenceSchema = z.intersection(
  z.union([
    z.object({
      frequency: z.enum([
        RecurrenceFrequency.daily,
        RecurrenceFrequency.weekly,
        RecurrenceFrequency.monthly,
        RecurrenceFrequency.yearly,
        RecurrenceFrequency.none,
      ]),
    }),
    z.object({
      frequency: z.literal(RecurrenceFrequency.custom), // The recurrence is weekly on certain days
      step: z.literal(RecurrenceStep.week), // The step is weekly
      interval: z.number(), // The interval between the recurrences
      days: z.array(z.boolean()).length(DAYS_IN_WEEK), // The days of the week on which the activity recurs
    }),
    z.object({
      frequency: z.literal(RecurrenceFrequency.custom), // The recurrence is weekly on certain days
      step: z.enum([
        RecurrenceStep.day,
        RecurrenceStep.month,
        RecurrenceStep.year,
      ]), // The step between the recurrences
      interval: z.number(), // The interval between the recurrences
    }),
  ]),
  z.union([
    z.object({
      ends: z.literal(RecurrenceEnds.on), // The recurrence ends on a certain date
      until: z.coerce.date(), // The date until which the activity recurs
    }),
    z.object({
      ends: z.literal(RecurrenceEnds.after), // The recurrence ends after a certain number of times
      times: z.number(), // The number of times the activity recurs
    }),
    z.object({
      ends: z.literal(RecurrenceEnds.never), // The recurrence never ends
    }),
  ])
);

export type ActivityRecurrence = z.infer<typeof activityRecurrenceSchema>;

/**
 * @apiDefine ActivitySuccess
 * @apiUse Hateoas
 * @apiSuccess {Date} start The start dateTime of the activity
 * @apiSuccess {Boolean} done Whether the activity is done
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.child Link to the child the activity belongs to
 * @apiSuccess {String} _links.template Link to the template the activity belongs to
 * @apiSuccess {String} _links.taskProgresses Link to the statuses of the activity tasks
 */
export class ActivityHateaos extends SimpleHateoas<Activity> {
  public referenceFields: (keyof Activity)[] = ["childId", "id"];
  public data: Activity;

  public constructor(data: Activity) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: new UrlBuilder()
        .addPrefix(Prefix.activity, { childId: this.data.childId })
        .addId(this.data.id)
        .toCompleteAPIPath(),
      template: new UrlBuilder()
        .addPrefix(Prefix.template, { childId: this.data.childId })
        .addId(this.data.templateId)
        .toCompleteAPIPath(),
      child: new UrlBuilder()
        .addPrefix(Prefix.child, {})
        .addId(this.data.childId)
        .toCompleteAPIPath(),
      taskProgresses: new UrlBuilder()
        .addPrefix(Prefix.taskProgress, {
          childId: this.data.childId,
          activityId: this.data.id,
        })
        .toCompleteAPIPath(),
    };
  }
}

/**
 * @apiDefine ActivityPostBody
 * @apiBody {Date} start The start of the activity
 * @apiBody {Boolean} [done=false] Whether the activity is done.
 * @apiBody {Emotion="HAPPY","NEUTRAL","SAD"} [emotion] The emotion of the activity
 * @apiBody {Boolean} [unclear=false] Whether the activity is unclear
 * @apiBody {String} templateUrl The url to the template
 * @apiUse ActivityRecurrence
 */
export const activityPostSchema = z.object({
  start: z.coerce.date(),
  done: z.coerce.boolean().optional(),
  emotion: z.nativeEnum(Emotion).optional(),
  unclear: z.boolean().optional(),
  templateUrl: z.string().url(),
  recurrence: activityRecurrenceSchema,
});

/**
 * @apiDefine ActivityPatchBody
 * @apiBody {Date} [start] The start of the activity
 * @apiBody {Boolean} [done] Whether the activity is done.
 * @apiBody {Emotion="HAPPY","NEUTRAL","SAD"} [emotion] The emotion of the activity
 * @apiBody {Boolean} [unclear] Whether the activity is unclear
 * @apiBody {String} [templateUrl] The url to the template
 */
export const activityPatchSchema = activityPostSchema.partial();

export type ActivityPost = z.infer<typeof activityPostSchema>;
export type ActivityPatch = z.infer<typeof activityPatchSchema>;

/**
 * @apiDefine TemplateSuccess
 * @apiUse Hateoas
 * @apiSuccess {boolean} visible Whether the template is visible
 * @apiSuccess {Overlapability} overlapability The overlapability of the template
 * @apiSuccess {Boolean} hasTime Whether the template has a time
 * @apiSuccess {String} summary The summary of the template
 * @apiSuccess {Integer} duration The duration of the template
 * @apiSuccess {String} [description] The description of the template
 * @apiSuccess {String} [location] The location of the template
 * @apiSuccess {Number} [geoLon] The geo longitude of the template
 * @apiSuccess {Number} [geoLat] The geo latitude of the template
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.child Link to the child the template belongs to
 * @apiSuccess {String} _links.tasks Link to the tasks of the template
 */
export class TemplateHateaos extends SimpleHateoas<Template> {
  public referenceFields: (keyof Template)[] = ["childId", "id", "imageId"];
  public data: Template;

  public constructor(data: Template) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    const links: Record<string, string> & { self: string } = {
      self: new UrlBuilder()
        .addPrefix(Prefix.template, {
          childId: this.data.childId,
        })
        .addId(this.data.id)
        .toCompleteAPIPath(),
      child: new UrlBuilder()
        .addPrefix(Prefix.child, {})
        .addId(this.data.childId)
        .toCompleteAPIPath(),
      tasks: new UrlBuilder()
        .addPrefix(Prefix.task, {
          childId: this.data.childId,
          templateId: this.data.id,
        })
        .toCompleteAPIPath(),
    };
    if (this.data.imageId) {
      links.image = new UrlBuilder()
        .addPrefix(Prefix.clarificationImage, {
          childId: this.data.childId,
        })
        .addId(this.data.imageId)
        .toCompleteAPIPath();
    }
    return links;
  }
}

/**
 * @apiDefine TemplatePostBody
 * @apiBody {Boolean} visible If the template is visible
 * @apiBody {Overlapability="DEFAULT","OVERLAPPING","BLOCKING"} overlapability The overlapability of the template
 * @apiBody {Boolean} hasTimer If the template has a timer
 * @apiBody {String} summary The summary of the template
 * @apiBody {Number} duration The duration of the template activity in seconds
 * @apiBody {String} [description] The description of the template
 * @apiBody {String} [location] The location of the template
 * @apiBody {Number} [geoLat] The geo longitute of the template
 * @apiBody {Number} [geoLon] The geo latitude of the template
 * @apiBody {String} [imageUrl] The url to the image of the template
 */
export const templatePostSchema = z.object({
  visible: z.boolean(),
  overlapability: z.nativeEnum(Overlapability),
  hasTimer: z.boolean(),

  summary: z.string(),
  duration: z.number().positive(),
  description: z.string().optional(),
  location: z.string().optional(),
  geoLat: z.number().optional(),
  geoLon: z.number().optional(),

  imageUrl: z.string().url().optional(),
});

/**
 * @apiDefine TemplatePatchBody
 * @apiBody {Boolean} [visible] If the template is visible
 * @apiBody {Overlapability} [overlapability] The overlapability of the template
 * @apiBody {Boolean} [hasTimer] If the template has a timer
 * @apiBody {String} [summary] The summary of the template
 * @apiBody {Number} [duration] The duration of the template activity in secondes
 * @apiBody {String} [description] The description of the template
 * @apiBody {String} [location] The location of the template
 * @apiBody {Number} [geoLat] The geo longitute of the template
 * @apiBody {Number} [geoLon] The geo latitude of the template
 */
export const templatePatchSchema = templatePostSchema.partial();

export type TemplatePost = z.infer<typeof templatePostSchema>;
export type TemplatePatch = z.infer<typeof templatePatchSchema>;

/**
 * @apiDefine ClarificationImageSuccess
 * @apiUse Hateoas
 * @apiSuccess {String} name The name of the image
 * @apiSuccess {String} reference The reference to the image
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.child Link to the child the task belongs to
 */
export class ClarificationImageHateaos extends SimpleHateoas<ClarificationImage> {
  public referenceFields: (keyof ClarificationImage)[] = ["childId"];
  public data: ClarificationImage;

  public constructor(data: ClarificationImage) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: new UrlBuilder()
        .addPrefix(Prefix.clarificationImage, {
          childId: this.data.childId,
        })
        .addId(this.data.id)
        .toCompleteAPIPath(),
      child: new UrlBuilder()
        .addPrefix(Prefix.child, {})
        .addId(this.data.childId)
        .toCompleteAPIPath(),
    };
  }
}

/**
 * @apiDefine ClarificationImagePostBody
 * @apiBody {String} name The name of the task
 * @apiBody {String} reference The reference to the image
 */
export const clarificationImagePostSchema = z.object({
  name: z.string(),
  reference: z.string(),
});

export type ClarificationImagePost = z.infer<
  typeof clarificationImagePostSchema
>;

/**
 * @apiDefine ClarificationImagePatchBody
 * @apiBody {String} [name] The name of the task
 * @apiBody {String} [reference] The reference to the image
 */
export const clarificationImagePatchSchema =
  clarificationImagePostSchema.partial();

export type ClarificationImagePatch = z.infer<
  typeof clarificationImagePatchSchema
>;

/**
 * @apiDefine TaskSuccess
 * @apiSuccess {String} description The description of the task
 * @apiSuccess {String} summary The summary of the task
 * @apiSuccess {Number} duration The duration of the task
 * @apiSuccess {Number} referenceNumber The reference number of the task
 * @apiUse Hateoas
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.child Link to the child the task belongs to
 * @apiSuccess {String} _links.template Link to the template the task belongs to
 * @apiSuccess {String} [_links.image] Link to the image of the task
 */
export class TaskHateaos extends SimpleHateoas<Task> {
  public referenceFields: (keyof Task)[] = ["id", "templateId", "imageId"];
  public data: Task;

  public constructor(data: Task, private childId: string) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    const links: Record<string, string> & { self: string } = {
      self: new UrlBuilder()
        .addPrefix(Prefix.task, {
          childId: this.childId,
          templateId: this.data.templateId,
        })
        .addId(this.data.id)
        .toCompleteAPIPath(),
      child: new UrlBuilder()
        .addPrefix(Prefix.child, {})
        .addId(this.childId)
        .toCompleteAPIPath(),
      template: new UrlBuilder()
        .addPrefix(Prefix.template, {
          childId: this.childId,
        })
        .addId(this.data.templateId)
        .toCompleteAPIPath(),
    };
    if (this.data.imageId) {
      links.image = new UrlBuilder()
        .addPrefix(Prefix.clarificationImage, {
          childId: this.childId,
        })
        .addId(this.data.imageId)
        .toCompleteAPIPath();
    }
    return links;
  }
}

/**
 * @apiDefine TaskPostBody
 * @apiBody {Number} referenceNumber The reference number of the task
 * @apiBody {String} summary The summary of the task
 * @apiBody {String} [description] The description of the task
 * @apiBody {Number} [duration] The duration of the task
 * @apiBody {String} [imageUrl] The url to the image
 */
export const taskPostSchema = z.object({
  referenceNumber: z.number(),
  summary: z.string(),
  description: z.string().optional(),
  duration: z.number().positive().optional(),

  imageUrl: z.string().url().optional(),
});

/**
 * @apiDefine TaskPatchBody
 * @apiBody {Number} [referenceNumber] The reference number of the task
 * @apiBody {String} [summary] The summary of the task
 * @apiBody {String} [description] The description of the task
 * @apiBody {Number} [duration] The duration of the task
 * @apiBody {String} [imageUrl] The url to the image
 */
export const taskPatchSchema = taskPostSchema.partial();

export type TaskPost = z.infer<typeof taskPostSchema>;
export type TaskPatch = z.infer<typeof taskPatchSchema>;

/**
 * @apiDefine TaskProgressSuccess
 * @apiUse Hateoas
 * @apiSuccess {Boolean} completed Whether the task is completed
 *
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.child Link to the child the survey was submitted for
 * @apiSuccess {String} _links.activity Link to the activity the task belongs to
 * @apiSuccess {String} _links.task Link to the task the progress belongs to
 */
export class TaskProgressHateaos extends SimpleHateoas<TaskProgress> {
  public referenceFields: (keyof TaskProgress)[] = ["taskId", "activityId"];

  public constructor(
    public data: TaskProgress,
    private childId: string,
    private templateId: string
  ) {
    super();
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: new UrlBuilder()
        .addPrefix(Prefix.taskProgress, {
          childId: this.childId,
          activityId: this.data.activityId,
        })
        .addId(this.data.taskId)
        .toCompleteAPIPath(),
      child: new UrlBuilder()
        .addPrefix(Prefix.child, {})
        .addId(this.childId)
        .toCompleteAPIPath(),
      activity: new UrlBuilder()
        .addPrefix(Prefix.activity, {
          childId: this.childId,
        })
        .addId(this.data.activityId)
        .toCompleteAPIPath(),
      task: new UrlBuilder()
        .addPrefix(Prefix.task, {
          childId: this.childId,
          templateId: this.templateId,
        })
        .addId(this.data.taskId)
        .toCompleteAPIPath(),
    };
  }
}

/**
 * @apiDefine TaskProgressPatchBody
 * @apiBody {Boolean} [done] Whether the task is done
 * @apiBody {Boolean} [unclear=false] Whether the task is unclear
 */
export const taskProgressPatchSchema = z.object({
  done: z.boolean().optional(),
  unclear: z.boolean().optional(),
});

export type TaskProgressPatch = z.infer<typeof taskProgressPatchSchema>;
