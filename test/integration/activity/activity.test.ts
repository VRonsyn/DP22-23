import { PrefixBlocks, Status } from "../../../src/util/consts";
import {
  authDelete,
  authGet,
  authPatch,
  authPost,
} from "../../util/authentication";
import {
  basicActivity,
  basicChildAccessRelation,
  basicTask,
  basicTaskProgress,
} from "../../util/prisma/valueCreators";
import { basicHateoasTest } from "../../util/hateoas";
import { prismaMock } from "../../../src/__mocks__/database";
import { basicActivityPost } from "../../util/prisma/postCreators";
import { toActivityIdUrl } from "../../../src/util/serialization";

jest.mock("../../../src/middleware/authentication");
jest.mock("../../../src/database");

function withPermission() {
  prismaMock.childAccessRelation.findMany.mockResolvedValue([
    basicChildAccessRelation(),
  ]);
}

function withoutPermission() {
  prismaMock.childAccessRelation.findMany.mockResolvedValue([]);
}

describe("Activity prefixed routes", () => {
  const childId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const activityId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const testPrefix = `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.activity}`;

  describe("GET /:id", () => {
    const testPath = `${testPrefix}/ad37ce4e-623e-437a-95e2-dd2e5133ce74`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves activity", async () => {
        prismaMock.activity.findUnique.mockResolvedValue(basicActivity());
        const res = await authGet(testPath).expect(Status.ok);
        basicHateoasTest(res.body);
      });

      it("Throws error on invalid id", async () => {
        prismaMock.activity.findUnique.mockResolvedValue(null);
        await authGet(testPath).expect(Status.notFound);
      });

      it("Throws error if childId is not id in activity", async () => {
        prismaMock.activity.findUnique.mockResolvedValue(
          basicActivity({ childId: "bd37ce4e-623e-437a-95e2-dd2e5133ce74" })
        );
        await authGet(testPath).expect(Status.notFound);
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authGet(testPath).expect(Status.forbidden);
    });
  });

  describe("POST /", () => {
    const testPath = `${testPrefix}/`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("throws RequestTypeError", async () => {
        await authPost(testPath, { apple: "apple" }).expect(Status.badRequest);
      });

      it("throws IdUrlParseError", async () => {
        await authPost(
          testPath,
          basicActivityPost({ templateUrl: "badUrl" })
        ).expect(Status.badRequest);
      });

      it("creates Activity", async () => {
        prismaMock.activity.create.mockResolvedValue(basicActivity());
        prismaMock.task.findMany.mockResolvedValue([basicTask()]);
        prismaMock.taskProgress.create.mockResolvedValue(basicTaskProgress());
        const res = await authPost(testPath, basicActivityPost()).expect(
          Status.created
        );
        basicHateoasTest(res.body);
        expect(prismaMock.activity.create).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPost(testPath, basicActivityPost()).expect(Status.forbidden);
    });
  });

  describe("PATCH /:id", () => {
    const testPath = `${testPrefix}/ad37ce4e-623e-437a-95e2-dd2e5133ce74`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("throws RequestTypeError", async () => {
        await authPatch(testPath, { apple: "apple" }).expect(Status.badRequest);
      });

      it("throws IdUrlParseError", async () => {
        await authPatch(
          testPath,
          basicActivityPost({ templateUrl: "badUrl" })
        ).expect(Status.badRequest);
      });

      it("updates Activity", async () => {
        prismaMock.activity.update.mockResolvedValue(basicActivity());
        prismaMock.task.findMany.mockResolvedValue([]);
        const res = await authPatch(testPath, basicActivityPost()).expect(
          Status.ok
        );
        basicHateoasTest(res.body);
        expect(prismaMock.activity.update).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPatch(testPath, basicActivityPost()).expect(Status.forbidden);
    });
  });

  describe("GET /", () => {
    const testPath = `${testPrefix}/`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves activities", async () => {
        prismaMock.activity.findMany.mockResolvedValue([basicActivity()]);
        const res = await authGet(testPath).expect(Status.ok);
        expect(res.body).toMatchObject({
          references: [toActivityIdUrl(childId, activityId)],
        });
        basicHateoasTest(res.body);
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authGet(testPath).expect(Status.forbidden);
    });
  });

  describe("DELETE /:id", () => {
    const testPath = `${testPrefix}/ad37ce4e-623e-437a-95e2-dd2e5133ce74`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("deletes Activity", async () => {
        prismaMock.activity.delete.mockResolvedValue(basicActivity());
        await authDelete(testPath).expect(Status.noContent);
        expect(prismaMock.activity.delete).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authDelete(testPath).expect(Status.forbidden);
    });
  });
});
