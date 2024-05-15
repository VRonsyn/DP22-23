import { PrefixBlocks, Status } from "../../../src/util/consts";
import { authGet, authPatch } from "../../util/authentication";
import {
  basicActivity,
  basicChildAccessRelation,
  basicTask,
  basicTaskProgress,
} from "../../util/prisma/valueCreators";
import { basicHateoasTest } from "../../util/hateoas";
import { prismaMock } from "../../../src/__mocks__/database";
import { basicTaskProgressPatch } from "../../util/prisma/patchCreators";
import { toTaskProgressIdUrl } from "../../../src/util/serialization";

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

describe("TaskProgress prefixed routes", () => {
  const childId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const activityId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const taskId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const templateId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const testPrefix = `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.activity}/${activityId}/${PrefixBlocks.taskProgress}`;

  describe("GET /:id", () => {
    const testPath = `${testPrefix}/ad37ce4e-623e-437a-95e2-dd2e5133ce74`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves taskProgress", async () => {
        prismaMock.taskProgress.findUnique.mockResolvedValue(
          basicTaskProgress()
        );
        prismaMock.activity.findUnique.mockResolvedValue(basicActivity());

        const res = await authGet(testPath).expect(Status.ok);
        basicHateoasTest(res.body);
      });

      it("Throws error on invalid id", async () => {
        prismaMock.question.findUnique.mockResolvedValue(null);
        await authGet(testPath).expect(Status.notFound);
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authGet(testPath).expect(Status.forbidden);
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
      it("Throws error on invalid id", async () => {
        prismaMock.question.findUnique.mockResolvedValue(null);
        await authPatch(testPath, basicTaskProgressPatch()).expect(
          Status.notFound
        );
      });

      it("updates TaskProgress", async () => {
        prismaMock.taskProgress.update.mockResolvedValue(basicTaskProgress());
        prismaMock.task.findUnique.mockResolvedValue(basicTask({ id: taskId }));
        const res = await authPatch(testPath, basicTaskProgressPatch()).expect(
          Status.ok
        );
        basicHateoasTest(res.body);
        expect(prismaMock.taskProgress.update).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPatch(testPath, basicTaskProgressPatch()).expect(
        Status.forbidden
      );
    });
  });

  describe("GET /", () => {
    const testPath = `${testPrefix}/`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves taskProgress", async () => {
        prismaMock.activity.findUnique.mockResolvedValue(
          basicActivity({ templateId })
        );
        prismaMock.taskProgress.findMany.mockResolvedValue([
          basicTaskProgress(),
        ]);
        const res = await authGet(testPath).expect(Status.ok);
        expect(res.body).toMatchObject({
          references: [toTaskProgressIdUrl(childId, activityId, taskId)],
        });
        basicHateoasTest(res.body);
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authGet(testPath).expect(Status.forbidden);
    });
  });
});
