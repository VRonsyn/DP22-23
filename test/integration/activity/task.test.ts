import { PrefixBlocks, Status } from "../../../src/util/consts";
import {
  authDelete,
  authGet,
  authPatch,
  authPost,
} from "../../util/authentication";
import {
  basicChildAccessRelation,
  basicTask,
} from "../../util/prisma/valueCreators";
import { basicHateoasTest } from "../../util/hateoas";
import { prismaMock } from "../../../src/__mocks__/database";
import { basicTaskPost } from "../../util/prisma/postCreators";
import { toTaskIdUrl } from "../../../src/util/serialization";

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

describe("Task prefixed routes", () => {
  const childId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const templateId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const taskId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const testPrefix = `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.template}/${templateId}/${PrefixBlocks.task}`;

  describe("GET /:id", () => {
    const testPath = `${testPrefix}/ad37ce4e-623e-437a-95e2-dd2e5133ce74`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves task", async () => {
        prismaMock.task.findUnique.mockResolvedValue(basicTask());
        const res = await authGet(testPath).expect(Status.ok);
        basicHateoasTest(res.body);
      });

      it("Throws error on invalid id", async () => {
        prismaMock.task.findUnique.mockResolvedValue(null);
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

      it("creates Task", async () => {
        prismaMock.task.create.mockResolvedValue(basicTask());
        prismaMock.activity.findMany.mockResolvedValue([]);
        const res = await authPost(testPath, basicTaskPost()).expect(
          Status.created
        );
        basicHateoasTest(res.body);
        expect(prismaMock.task.create).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPost(testPath, basicTaskPost()).expect(Status.forbidden);
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

      it("updates Task", async () => {
        prismaMock.task.update.mockResolvedValue(basicTask());
        const res = await authPatch(testPath, basicTaskPost()).expect(
          Status.ok
        );
        basicHateoasTest(res.body);
        expect(prismaMock.task.update).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPatch(testPath, basicTaskPost()).expect(Status.forbidden);
    });
  });

  describe("GET /", () => {
    const testPath = `${testPrefix}/`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves task", async () => {
        prismaMock.task.findMany.mockResolvedValue([basicTask()]);
        const res = await authGet(testPath).expect(Status.ok);
        expect(res.body).toMatchObject({
          references: [toTaskIdUrl(childId, templateId, taskId)],
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

      it("deletes Task", async () => {
        prismaMock.task.delete.mockResolvedValue(basicTask());
        await authDelete(testPath).expect(Status.noContent);
        expect(prismaMock.task.delete).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authDelete(testPath).expect(Status.forbidden);
    });
  });
});
