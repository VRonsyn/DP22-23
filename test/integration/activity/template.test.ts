import { PrefixBlocks, Status } from "../../../src/util/consts";
import {
  authDelete,
  authGet,
  authPatch,
  authPost,
} from "../../util/authentication";
import {
  basicChildAccessRelation,
  basicTemplate,
} from "../../util/prisma/valueCreators";
import { basicHateoasTest } from "../../util/hateoas";
import { prismaMock } from "../../../src/__mocks__/database";
import { basicTemplatePost } from "../../util/prisma/postCreators";
import { toTemplateIdUrl } from "../../../src/util/serialization";

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

describe("Template prefixed routes", () => {
  const childId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const templateId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const testPrefix = `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.template}`;

  describe("GET /:id", () => {
    const testPath = `${testPrefix}/${templateId}`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves template", async () => {
        prismaMock.template.findUnique.mockResolvedValue(basicTemplate());
        const res = await authGet(testPath).expect(Status.ok);
        basicHateoasTest(res.body);
      });

      it("Throws error on invalid id", async () => {
        prismaMock.question.findUnique.mockResolvedValue(null);
        await authGet(testPath).expect(Status.notFound);
      });

      it("Throws error if childId is not id in template", async () => {
        prismaMock.template.findUnique.mockResolvedValue(
          basicTemplate({
            childId: "bd37ce4e-623e-437a-95e2-dd2e5133ce74",
          })
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

      it("creates Template", async () => {
        prismaMock.template.create.mockResolvedValue(basicTemplate());
        const res = await authPost(testPath, basicTemplatePost()).expect(
          Status.created
        );
        basicHateoasTest(res.body);
        expect(prismaMock.template.create).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPost(testPath, basicTemplatePost()).expect(Status.forbidden);
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

      it("updates Template", async () => {
        prismaMock.template.update.mockResolvedValue(basicTemplate());
        prismaMock.task.findMany.mockResolvedValue([]);
        const res = await authPatch(testPath, basicTemplatePost()).expect(
          Status.ok
        );
        basicHateoasTest(res.body);
        expect(prismaMock.template.update).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPatch(testPath, basicTemplatePost()).expect(Status.forbidden);
    });
  });

  describe("GET /", () => {
    const testPath = `${testPrefix}/`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves templates", async () => {
        prismaMock.template.findMany.mockResolvedValue([basicTemplate()]);
        const res = await authGet(testPath).expect(Status.ok);
        expect(res.body).toMatchObject({
          references: [toTemplateIdUrl(childId, templateId)],
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

      it("deletes Template", async () => {
        prismaMock.template.delete.mockResolvedValue(basicTemplate());
        await authDelete(testPath).expect(Status.noContent);
        expect(prismaMock.template.delete).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authDelete(testPath).expect(Status.forbidden);
    });
  });
});
