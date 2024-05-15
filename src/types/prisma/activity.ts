import {
  ActivityPatch,
  ActivityPost,
  ClarificationImagePatch,
  ClarificationImagePost,
  TaskPatch,
  TaskPost,
  TaskProgressPatch,
  TemplatePatch,
  TemplatePost,
} from "../express/activity";
import { Prisma } from "@prisma/client";
import {
  idUrlToClarificationImageId,
  idURLToTemplateId,
} from "../../util/parser";

export function asPrismaActivity(
  activity: ActivityPost,
  childId: string
): Prisma.ActivityUncheckedCreateInput {
  return {
    start: activity.start,

    done: activity.done,
    emotion: activity.emotion,
    unclear: activity.unclear,

    childId,
    templateId: idURLToTemplateId(activity.templateUrl),
  };
}

export function asPrismaActivityPatch(
  activity: ActivityPatch,
  childId: string
): Prisma.ActivityUncheckedUpdateInput {
  return {
    start: activity.start,

    done: activity.done,
    emotion: activity.emotion,
    unclear: activity.unclear,

    childId,
    templateId: activity.templateUrl
      ? idURLToTemplateId(activity.templateUrl)
      : undefined,
  };
}

export function asPrismaClarificationImage(
  clarificationImage: ClarificationImagePost,
  childId: string
): Prisma.ClarificationImageUncheckedCreateInput {
  return {
    name: clarificationImage.name,
    reference: clarificationImage.reference,
    childId,
  };
}

export function asPrismaClarificationImagePatch(
  clarificationImage: ClarificationImagePatch,
  childId: string
): Prisma.ClarificationImageUncheckedUpdateInput {
  return {
    name: clarificationImage.name,
    reference: clarificationImage.reference,
    childId,
  };
}

export function asPrismaTemplate(
  template: TemplatePost,
  childId: string
): Prisma.TemplateUncheckedCreateInput {
  return {
    visible: template.visible,
    overlapability: template.overlapability,
    hasTimer: template.hasTimer,

    summary: template.summary,
    duration: template.duration,
    location: template.location,
    geoLon: template.geoLon,
    geoLat: template.geoLat,

    childId,
    imageId: template.imageUrl
      ? idUrlToClarificationImageId(template.imageUrl)
      : null,
  };
}

export function asPrismaTemplatePatch(
  template: TemplatePatch,
  childId: string
): Prisma.TemplateUncheckedUpdateInput {
  return {
    visible: template.visible,
    overlapability: template.overlapability,
    hasTimer: template.hasTimer,

    summary: template.summary,
    duration: template.duration,
    location: template.location,
    geoLon: template.geoLon,
    geoLat: template.geoLat,

    childId,
    imageId: template.imageUrl
      ? idUrlToClarificationImageId(template.imageUrl)
      : null,
  };
}

export function asPrismaTask(
  task: TaskPost,
  templateId: string
): Prisma.TaskUncheckedCreateInput {
  return {
    referenceNumber: task.referenceNumber,
    summary: task.summary,
    description: task.description,
    duration: task.duration,

    templateId,
    imageId: task.imageUrl
      ? idUrlToClarificationImageId(task.imageUrl)
      : task.imageUrl,
  };
}

export function asPrismaTaskPatch(
  task: TaskPatch,
  templateId: string
): Prisma.TaskUncheckedUpdateInput {
  return {
    referenceNumber: task.referenceNumber,
    summary: task.summary,
    description: task.description,
    duration: task.duration,

    templateId,
    imageId: task.imageUrl
      ? idUrlToClarificationImageId(task.imageUrl)
      : task.imageUrl,
  };
}

export function asPrismaTaskProgressPatch(
  progress: TaskProgressPatch
): Prisma.TaskProgressUncheckedUpdateInput {
  return {
    done: progress.done,
    unclear: progress.unclear,
  };
}
