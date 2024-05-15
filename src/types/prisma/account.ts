import { Prisma } from "@prisma/client";
import { ExternalCalendarPost, GuardianPost } from "../express/account";

/**
 * @param guardian GuardianPost to be converted to a Prisma Guardian
 * @param auth0Id The auth0Id of the guardian
 */
export function asPrismaGuardian(
  guardian: GuardianPost,
  auth0Id: string
): Prisma.GuardianUncheckedCreateInput {
  return {
    name: guardian.name,
    auth0Id: auth0Id,
    //TODO: Add picture
  };
}

export function asPrismaExternalCalendar(
  externalCalendar: ExternalCalendarPost,
  accountId: string
): Prisma.ExternalCalendarUncheckedCreateInput {
  return {
    ...externalCalendar,
    guardianId: accountId,
  };
}
