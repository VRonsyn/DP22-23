import { PrefixBlocks, Status } from "../../../src/util/consts";
import {
  authDelete,
  authGet,
  authPatch,
  authPost,
} from "../../util/authentication";
import {
  basicChildAccessRelation,
  basicClarificationImage,
} from "../../util/prisma/valueCreators";
import { basicHateoasTest } from "../../util/hateoas";
import { prismaMock } from "../../../src/__mocks__/database";
import { basicClarificationImagePost } from "../../util/prisma/postCreators";

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

describe("ClarificationImage prefixed routes", () => {
  const childId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const clarificationImageId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const testPrefix = `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.clarificationImage}`;

  describe("GET /:id", () => {
    const testPath = `${testPrefix}/${clarificationImageId}`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves clarificationImage", async () => {
        prismaMock.clarificationImage.findUnique.mockResolvedValue(
          basicClarificationImage()
        );
        const res = await authGet(testPath).expect(Status.ok);
        basicHateoasTest(res.body);
      });

      it("Throws error on invalid id", async () => {
        prismaMock.question.findUnique.mockResolvedValue(null);
        await authGet(testPath).expect(Status.notFound);
      });

      it("Throws error if childId is not id in clarificationImage", async () => {
        prismaMock.clarificationImage.findUnique.mockResolvedValue(
          basicClarificationImage({
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

      it("creates clarificationImage", async () => {
        prismaMock.clarificationImage.create.mockResolvedValue(
          basicClarificationImage()
        );
        prismaMock.clarificationImage.findMany.mockResolvedValue([]);
        const res = await authPost(
          testPath,
          basicClarificationImagePost()
        ).expect(Status.created);
        basicHateoasTest(res.body);
        expect(prismaMock.clarificationImage.create).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPost(testPath, basicClarificationImagePost()).expect(
        Status.forbidden
      );
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

      it("updates clarificationImage", async () => {
        prismaMock.clarificationImage.update.mockResolvedValue(
          basicClarificationImage()
        );
        const res = await authPatch(
          testPath,
          basicClarificationImagePost()
        ).expect(Status.ok);
        basicHateoasTest(res.body);
        expect(prismaMock.clarificationImage.update).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPatch(testPath, basicClarificationImagePost()).expect(
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

      it("Resolves clarificationImages", async () => {
        prismaMock.clarificationImage.findMany.mockResolvedValue([
          basicClarificationImage(),
        ]);
        const res = await authGet(testPath).expect(Status.ok);
        basicHateoasTest(res.body);
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authGet(testPath).expect(Status.forbidden);
    });
  });

  describe("DELETE /:id", () => {
    const testPath = `${testPrefix}/${clarificationImageId}`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("deletes clarificationImages", async () => {
        prismaMock.clarificationImage.delete.mockResolvedValue(
          basicClarificationImage()
        );
        await authDelete(testPath).expect(Status.noContent);
        expect(prismaMock.clarificationImage.delete).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authDelete(testPath).expect(Status.forbidden);
    });
  });
});
