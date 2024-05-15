import jwt_decode from "jwt-decode";
import prisma from "../database";
import { GuardianPermission, ServerRole } from "@prisma/client";
import { ForbiddenError } from "./errors";

type Token = {
  sub: string;
};

/**
 * Extract the auth0 id from the JWT token from a request.
 * @param authHeader
 */
export function getUserAuth0Id(authHeader: string): string {
  return jwt_decode<Token>(authHeader)["sub"];
}

/**
 * Get the id of the guardian from the authorization token and check if it is the same as the id in the url
 * @throws ForbiddenError if the id in the url is not the same as the id in the authorization token
 * @param headerToken the authorization token
 * @param auth0Id the auth0Id of the guardian
 */
export function authorizeWithAuth0Id(
  headerToken: string,
  auth0Id: string
): void {
  const tokenId = getUserAuth0Id(headerToken);
  if (tokenId !== auth0Id) {
    throw new ForbiddenError("You are not authorized to access this resource");
  }
}

/**
 * Check if the guardian with the provided headerToken has admin access
 * @param headerToken the authorization token
 */
export async function authorizeAsAdmin(headerToken: string): Promise<void> {
  const tokenId = getUserAuth0Id(headerToken);
  const user = await prisma.guardian.findUnique({
    where: {
      auth0Id: tokenId,
    },
  });
  if (user?.serverRole !== ServerRole.ADMIN) {
    throw new ForbiddenError("You do not have sufficient permissions");
  }
}

/**
 * Check if the guardian with the provided headerToken has access to the child with the provided childId
 * @param headerToken the authorization token
 * @param childId the id of the child
 * @param allowedPermissions the permissions that are allowed
 */
export async function authorizeChildAccess(
  headerToken: string,
  childId: string,
  allowedPermissions: GuardianPermission[]
): Promise<void> {
  const tokenId = getUserAuth0Id(headerToken);
  const childAccessRelations = await prisma.childAccessRelation.findMany({
    where: {
      guardian: {
        auth0Id: tokenId,
      },
      childId: childId,
    },
  });
  if (
    !childAccessRelations.some((relation) =>
      allowedPermissions.includes(relation.permission)
    )
  ) {
    throw new ForbiddenError("You do not have sufficient permissions");
  }
}

export async function authorizeAtLeastGuardian(
  headerToken: string,
  childId: string
): Promise<void> {
  return await authorizeChildAccess(headerToken, childId, [
    GuardianPermission.ADMIN,
    GuardianPermission.GUARDIAN,
  ]);
}

export async function authorizeAdmin(
  headerToken: string,
  childId: string
): Promise<void> {
  return await authorizeChildAccess(headerToken, childId, [
    GuardianPermission.ADMIN,
  ]);
}
