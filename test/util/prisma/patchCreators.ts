import { TaskProgressPatch } from "../../../src/types/express/activity";

export function basicTaskProgressPatch(
  startValue?: Partial<TaskProgressPatch>
): TaskProgressPatch {
  return {
    done: startValue?.done ?? true,
    unclear: startValue?.unclear ?? false,
  };
}
