import { prismaMock } from "../../src/__mocks__/database";
import {
  authDelete,
  authGet,
  authPatch,
  authPost,
  TEST_AUTH0_ID,
} from "../util/authentication";
import { Prefix, Status } from "../../src/util/consts";
import {
  basicChild,
  basicChildAccessRelation,
  basicChildSettings,
  basicGuardian,
} from "../util/prisma/valueCreators";
import { GuardianPermission } from "@prisma/client";
import { basicChildPost } from "../util/prisma/postCreators";
import { toCompleteAPIPath } from "../../src/util/serialization";

jest.mock("../../src/middleware/authentication");
jest.mock("../../src/database");

beforeEach(() => {
  prismaMock.guardian.findUnique.mockResolvedValue(
    basicGuardian({ auth0Id: TEST_AUTH0_ID })
  );
});

describe("Children prefixed routes", () => {
  describe("GET /", () => {
    it("No children", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([]);
      const res = await authGet(Prefix.child).expect(Status.ok);
      expect(res.body.references).toEqual([]);
    });

    it("A child", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([
        basicChildAccessRelation(),
      ]);
      const res = await authGet(Prefix.child).expect(Status.ok);
      expect(res.body.references.length).toEqual(1);
    });
  });

  const path = `${Prefix.child}/1`;

  describe("GET /:id", () => {
    it("Forbidden/invalid id", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([]);
      await authGet(path).expect(Status.forbidden);
    });

    it("Valid id", async () => {
      prismaMock.childAccessRelation.findFirst.mockResolvedValue(
        basicChildAccessRelation({ permission: GuardianPermission.GUARDIAN })
      );
      prismaMock.child.findUniqueOrThrow.mockResolvedValue(basicChild());
      prismaMock.childAccessRelation.findMany.mockResolvedValue([
        basicChildAccessRelation({
          guardianId: "gi",
          permission: GuardianPermission.GUARDIAN,
        }),
        basicChildAccessRelation({
          guardianId: "gi",
          permission: GuardianPermission.ADMIN,
        }),
      ]);
      const res = await authGet(path).expect(Status.ok);
      expect(
        res.body.guardians[toCompleteAPIPath(`/account/gi`)].sort()
      ).toEqual(["ADMIN", "GUARDIAN"]);
    });
  });

  describe("POST /", () => {
    it("Create child", async () => {
      prismaMock.childAccessRelation.findFirst.mockResolvedValue(
        basicChildAccessRelation({ permission: GuardianPermission.GUARDIAN })
      );
      prismaMock.childAccessRelation.findMany.mockResolvedValue([]);
      prismaMock.childSettings.create.mockResolvedValue(basicChildSettings());
      prismaMock.child.create.mockResolvedValue(basicChild());
      prismaMock.childAccessRelation.create.mockResolvedValue(
        basicChildAccessRelation()
      );
      await authPost(Prefix.child, basicChildPost()).expect(Status.created);
    });
  });

  describe("PATCH /:id", () => {
    it("Forbidden/invalid id", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([]);
      await authPatch(path, basicChildPost()).expect(Status.forbidden);
    });

    it("Not admin", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([
        basicChildAccessRelation({
          permission: GuardianPermission.GUARDIAN,
        }),
      ]);

      prismaMock.child.update.mockResolvedValue(basicChild());
      prismaMock.child.findUniqueOrThrow.mockResolvedValue(basicChild());
      await authPatch(path, basicChildPost()).expect(Status.ok);
    });

    it("Not admin, remove himself", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([
        basicChildAccessRelation({
          permission: GuardianPermission.GUARDIAN,
        }),
        basicChildAccessRelation({
          guardianId: "id",
          permission: GuardianPermission.ADMIN,
        }),
      ]);
      prismaMock.child.update.mockResolvedValue(basicChild());
      prismaMock.guardian.findUniqueOrThrow.mockResolvedValue(basicGuardian());
      prismaMock.child.findUniqueOrThrow.mockResolvedValue(basicChild());
      await authPatch(
        path,
        basicChildPost({
          guardians: { "1": [GuardianPermission.ADMIN] },
        })
      ).expect(Status.ok);
    });

    it("Admin", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([
        basicChildAccessRelation({
          permission: GuardianPermission.ADMIN,
        }),
      ]);
      prismaMock.childAccessRelation.findFirst.mockResolvedValue(
        basicChildAccessRelation({ permission: GuardianPermission.GUARDIAN })
      );
      prismaMock.child.update.mockResolvedValue(basicChild());
      prismaMock.child.findUniqueOrThrow.mockResolvedValue(basicChild());
      await authPatch(path, basicChildPost()).expect(Status.ok);
    });
  });

  describe("DELETE /:id", () => {
    it("Forbidden/invalid id", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([]);
      await authDelete(path).expect(Status.forbidden);
    });

    it("Not admin", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([
        basicChildAccessRelation({
          permission: GuardianPermission.GUARDIAN,
        }),
      ]);
      await authDelete(path).expect(Status.forbidden);
    });

    it("Admin", async () => {
      prismaMock.childAccessRelation.findMany.mockResolvedValue([
        basicChildAccessRelation({
          permission: GuardianPermission.ADMIN,
        }),
      ]);
      prismaMock.child.update.mockResolvedValue(basicChild());
      prismaMock.child.findUniqueOrThrow.mockResolvedValue(basicChild());
      await authDelete(path).expect(Status.noContent);
    });
  });
});
