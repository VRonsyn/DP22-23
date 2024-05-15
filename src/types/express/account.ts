import { z } from "zod";
import { ExternalCalendar, Guardian } from "@prisma/client";
import { SimpleHateoas } from "./hateoas";
import { toExternalCalendarIdUrl, toIdUrl } from "../../util/serialization";
import { Prefix } from "../../util/consts";
import validator from "validator";

export const guardianPostSchema = z.object({
  name: z.string(),
  //TODO: Add picture
});

/**
 * @apiDefine AccountPostBody
 * @apiBody {String} name The name of the account
 */
export type GuardianPost = z.infer<typeof guardianPostSchema>;

/**
 * @apiDefine AccountSuccess
 * @apiUse Hateoas
 * @apiSuccess {String} name The name of the account
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.self Link to the account
 * @apiSuccess {String} _links.externalCalendars Link to the externalCalendars of the account
 */
export class GuardianHateoas extends SimpleHateoas<Guardian> {
  public referenceFields: (keyof Guardian)[] = ["auth0Id"];
  public data: Guardian;

  public constructor(data: Guardian) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: toIdUrl(this.data.id, Prefix.account),
      externalCalendars: toExternalCalendarIdUrl(this.data.id, ""),
    };
  }
}

/**
 * @apiDefine ExternalCalendarSuccess
 * @apiUse Hateoas
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.self Link to the externalCalendar
 * @apiSuccess {String} _links.guardian Link to the child the externalCalendar belongs to
 */
export class ExternalCalendarHateaos extends SimpleHateoas<ExternalCalendar> {
  public referenceFields: (keyof ExternalCalendar)[] = ["id", "guardianId"];
  public data: ExternalCalendar;

  public constructor(data: ExternalCalendar) {
    super();
    this.data = data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: toExternalCalendarIdUrl(this.data.guardianId, this.data.id),
      guardian: toIdUrl(this.data.guardianId, Prefix.account),
    };
  }
}

/**
 * @apiDefine ExternalCalendarPostBody
 * @apiBody {String} name The name of the externalCalendar
 * @apiBody {String} [color] The color of the externalCalendar
 * @apiBody {String} url The url of the externalCalendar
 */
export const externalCalendarPostSchema = z.object({
  name: z.string(),
  color: z
    .string()
    .refine(validator.isHexColor, {
      message: "Must be a valid hex color",
    })
    .optional(),
  url: z.string().url(),
});

/**
 * @apiDefine ExternalCalendarPatchBody
 * @apiBody {String} [name] The name of the externalCalendar
 * @apiBody {String} [color] The color of the externalCalendar
 * @apiBody {String} [url] The url of the externalCalendar */
export const externalCalendarPatchSchema = externalCalendarPostSchema.partial();

export type ExternalCalendarPost = z.infer<typeof externalCalendarPostSchema>;
