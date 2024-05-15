import { z } from "zod";
import {
  Child,
  ChildAnimationAmount,
  ChildColor,
  ChildHomeScreen,
  ChildLanguage,
  ChildSettings,
  ChildShowPastActivities,
  ChildTextAmount,
  ChildTime,
  GuardianPermission,
} from "@prisma/client";
import { Hateoas } from "./hateoas";
import { toIdUrl, toSubmittedSurveyIdUrl } from "../../util/serialization";
import { Prefix } from "../../util/consts";
import { UrlBuilder } from "../../util/urlBuilder";

export type ChildWithSettings = Child & { settings: ChildSettings };

// NOTE: Default values are defined in the database.
// If you change them, you have to change the docs below.
/**
 * @apiDefine ChildSettings
 * @apiBody {Object} settings The settings of the child
 * @apiBody {string= VISUAL, DIGITAL} [settings.time=VISUAL] Representation of time
 * @apiBody {string= ENGLISH, DUTCH} [settings.language=DUTCH] Language of the app as seen by the child
 * @apiBody {string= NONE, TITLE_ONLY, ALL} [settings.textAmount=ALL] Amount of text shown in the app
 * @apiBody {string= NONE, REDUCED, ALL} [settings.animationAmount=ALL] Amount of animations shown in the app
 * @apiBody {string= DAY, WEEK} [settings.homeScreen=DAY] The page the child sees when pressing the home button
 * @apiBody {string= HIDDEN, PARTIAL} [settings.showPastActivities=PARTIAL] Whether the child can view past activities
 * @apiBody {string} [emergencyNumber] the emergency number of the child
 *
 * @apiBody {boolean} [settings.canViewDayOverview=true] Whether the child can view the day overview
 * @apiBody {boolean} [settings.canViewWeekOverview=true] Whether the child can view the week overview
 *
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.primaryColor=PURPLE] The primary color of the app
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.mondayColor=BLUE] The color of the monday
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.tuesdayColor=LIGHT_BLUE] The color of the tuesday
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.wednesdayColor=TEAL] The color of the wednesday
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.thursdayColor=GREEN] The color of the thursday
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.fridayColor=LIGHT_GREEN] The color of the friday
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.saturdayColor=ORANGE] The color of the saturday
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.sundayColor=RED] The color of the sunday
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.paletteFirst=BLUE] The first palette color
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.paletteSecond=LIGHT_BLUE] The second palette color
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.paletteThird=TEAL] The third palette color
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.paletteFourth=GREEN] The fourth palette color
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.paletteFifth=LIGHT_GREEN] The fifth palette color
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.paletteSixth=ORANGE] The sixth palette color
 * @apiBody {string= RED, PINK, PURPLE, DEEP_PURPLE, INDIGO, BLUE, LIGHT_BLUE, CYAN, TEAL, GREEN, LIGHT_GREEN, LIME, YELLOW, AMBER, ORANGE, DEEP_ORANGE, BROWN, GREY, BLUE_GREY} [settings.paletteSeventh=RED] The seventh palette color
 */
export const settingsSchema = z.object({
  time: z.nativeEnum(ChildTime).optional(),
  language: z.nativeEnum(ChildLanguage).optional(),
  textAmount: z.nativeEnum(ChildTextAmount).optional(),
  animationAmount: z.nativeEnum(ChildAnimationAmount).optional(),
  homeScreen: z.nativeEnum(ChildHomeScreen).optional(),
  showPastActivities: z.nativeEnum(ChildShowPastActivities).optional(),
  emergencyNumber: z.string().optional(),

  canViewDayOverview: z.boolean().optional(),
  canViewWeekOverview: z.boolean().optional(),

  primaryColor: z.nativeEnum(ChildColor).optional(),
  mondayColor: z.nativeEnum(ChildColor).optional(),
  tuesdayColor: z.nativeEnum(ChildColor).optional(),
  wednesdayColor: z.nativeEnum(ChildColor).optional(),
  thursdayColor: z.nativeEnum(ChildColor).optional(),
  fridayColor: z.nativeEnum(ChildColor).optional(),
  saturdayColor: z.nativeEnum(ChildColor).optional(),
  sundayColor: z.nativeEnum(ChildColor).optional(),

  paletteFirst: z.nativeEnum(ChildColor).optional(),
  paletteSecond: z.nativeEnum(ChildColor).optional(),
  paletteThird: z.nativeEnum(ChildColor).optional(),
  paletteFourth: z.nativeEnum(ChildColor).optional(),
  paletteFifth: z.nativeEnum(ChildColor).optional(),
  paletteSixth: z.nativeEnum(ChildColor).optional(),
  paletteSeventh: z.nativeEnum(ChildColor).optional(),
});

export const childPostSchema = z.object({
  name: z.string(),
  settings: settingsSchema.strict().optional(),
  guardians: z
    .record(
      z.array(z.enum([GuardianPermission.ADMIN, GuardianPermission.GUARDIAN]))
    )
    .optional(),
});

/**
 * @apiDefine ChildPatchBody
 * @apiBody {String} [name] The name of the child
 * @apiBody {Object} [settings] The settings of the child
 * @apiBody {Object} [guardians] The guardians of the child and their permissions
 * @apiUse ChildSettings
 */

/**
 * @apiDefine ChildPostBody
 * @apiBody {String} name The name of the child
 * @apiBody {Object} [guardians] The guardians of the child and their permissions
 * @apiUse ChildSettings
 */
export type ChildPost = z.infer<typeof childPostSchema>;

/**
 * @apiDefine ChildSuccess
 * @apiUse Hateoas
 * @apiSuccess {String} name The name of the child
 * @apiSuccess {Object} guardians The guardians of the child and their permissions
 * @apiSuccess {Object} settings The settings of the child
 * @apiSuccess {Object} _links Links to related resources
 * @apiSuccess {String} _links.activities Links to activities of the child
 * @apiSuccess {String} _links.templates Links to templates of the child
 * @apiSuccess {String} _links.objects Links to objects of the child
 * @apiSuccess {String} _links.submittedSurveys Links to submitted surveys of the child
 */
export class ChildHateoas extends Hateoas<
  ChildWithSettings,
  Child & { guardians: { [guardian: string]: GuardianPermission[] } }
> {
  public referenceFields: string[] = ["settingsId", "settings.id"];
  public data: ChildWithSettings;

  public constructor(
    data: ChildWithSettings,
    private guardians: { [guardian: string]: GuardianPermission[] }
  ) {
    super();
    this.data = data;
  }

  protected dataExpander(
    data: ChildWithSettings
  ): Child & { guardians: { [guardian: string]: GuardianPermission[] } } {
    return {
      ...data,
      guardians: this.guardians,
    };
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return {
      self: toIdUrl(this.data.id, Prefix.child),
      activities: new UrlBuilder()
        .addPrefix(Prefix.activity, {
          childId: this.data.id,
        })
        .toCompleteAPIPath(),
      templates: new UrlBuilder()
        .addPrefix(Prefix.template, {
          childId: this.data.id,
        })
        .toCompleteAPIPath(),
      clarificationImages: new UrlBuilder()
        .addPrefix(Prefix.clarificationImage, {
          childId: this.data.id,
        })
        .toCompleteAPIPath(),
      submittedSurveys: toSubmittedSurveyIdUrl(this.data.id, ""),
      ical: new UrlBuilder()
        .addPrefix(Prefix.ical, { childId: this.data.id })
        .toCompleteAPIPath(),
    };
  }
}
