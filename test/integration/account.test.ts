import { prismaMock } from "../../src/__mocks__/database";
import {
  authDelete,
  authGet,
  authPost,
  TEST_AUTH0_ID,
} from "../util/authentication";
import { Prefix, Status } from "../../src/util/consts";
import {
  basicChildAccessRelation,
  basicGuardian,
} from "../util/prisma/valueCreators";
import { GuardianPermission } from "@prisma/client";
import { basicGuardianPost } from "../util/prisma/postCreators";
import { toIdUrl } from "../../src/util/serialization";

jest.mock("../../src/middleware/authentication");
jest.mock("../../src/database");

describe("Account prefixed routes", () => {
  const invalidPath = `${Prefix.account}/id_from_someone_else`;
  const accountId = basicGuardian().id;
  const validPath = `${Prefix.account}/${accountId}`;

  describe("GET /", () => {
    it("Redirects to /:accountId", async () => {
      prismaMock.guardian.findUnique.mockResolvedValue(basicGuardian());
      const res = await authGet(Prefix.account).expect(Status.found);
      expect(res.header.location).toBe(toIdUrl(accountId, Prefix.account));
    });
  });

  describe("GET /:accountId", () => {
    it("Returns user info", async () => {
      prismaMock.guardian.findUnique.mockResolvedValue(
        basicGuardian({ auth0Id: TEST_AUTH0_ID })
      );
      await authGet(validPath).expect(Status.ok);
    });
  });

  describe("POST /", () => {
    it("Create user if user does not exist", async () => {
      prismaMock.guardian.findUnique.mockResolvedValue(null);
      prismaMock.guardian.create.mockResolvedValue(basicGuardian());
      await authPost(Prefix.account, basicGuardianPost()).expect(
        Status.created
      );
    });

    it("Throws ConflictError if user already exists", async () => {
      prismaMock.guardian.findUnique.mockResolvedValue(basicGuardian());
      await authPost(Prefix.account, basicGuardianPost()).expect(
        Status.conflict
      );
    });
  });

  describe("DELETE /:accountId", () => {
    it("Throws ForbiddenError", async () => {
      prismaMock.guardian.findUnique.mockResolvedValue(basicGuardian());
      await authDelete(invalidPath).expect(Status.forbidden);
    });

    it("Throw ConflictError if user is admin of a child", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([
        basicChildAccessRelation({
          guardianId: accountId,
          permission: GuardianPermission.ADMIN,
        }),
      ]);
      prismaMock.guardian.findUnique.mockResolvedValue(
        basicGuardian({ auth0Id: TEST_AUTH0_ID })
      );
      await authDelete(validPath).expect(Status.conflict);
    });

    it("Delete user if he is not ADMIN of a child", async () => {
      prismaMock.guardian.findUnique.mockResolvedValue(
        basicGuardian({ auth0Id: TEST_AUTH0_ID })
      );
      prismaMock.childAccessRelation.findMany.mockResolvedValue([]);
      await authDelete(validPath).expect(Status.noContent);
    });
  });
});
