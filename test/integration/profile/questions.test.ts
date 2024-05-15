import { PrefixBlocks, Status } from "../../../src/util/consts";
import { authGet, authPost } from "../../util/authentication";
import {
  basicGuardian,
  basicQuestion,
  basicSurvey,
} from "../../util/prisma/valueCreators";
import { basicHateoasTest } from "../../util/hateoas";
import { prismaMock } from "../../../src/__mocks__/database";
import { basicQuestionPost } from "../../util/prisma/postCreators";

jest.mock("../../../src/middleware/authentication");
jest.mock("../../../src/database");

describe("Question prefixed routes", () => {
  const testPrefix = `/${PrefixBlocks.survey}/banana/${PrefixBlocks.question}`;
  describe("GET /:id", () => {
    const testPath = `${testPrefix}/1`;

    it("Resolves answer", async () => {
      prismaMock.question.findFirst.mockResolvedValue(
        basicQuestion({ surveyName: "apple", id: "1" })
      );
      const res = await authGet(testPath).expect(Status.ok);
      expect(res.body).toMatchObject({
        title: "title",
        description: ["description"],
      });
      basicHateoasTest(res.body);
    });

    it("Throws error on invalid id", async () => {
      prismaMock.question.findFirst.mockResolvedValue(null);
      await authGet(testPath).expect(Status.notFound);
    });
  });

  describe("POST /", () => {
    const testPath = `${testPrefix}/`;

    describe("with permission", () => {
      beforeEach(() => {
        // Handle authorization
        prismaMock.guardian.findUnique.mockResolvedValue(
          basicGuardian({ serverRole: "ADMIN" })
        );
      });

      it("throws RequestTypeError", async () => {
        await authPost(testPath, { apple: "apple" }).expect(Status.badRequest);
      });

      it("throws NotFoundError", async () => {
        prismaMock.survey.findFirst.mockResolvedValue(null);
        await authPost(testPath, basicQuestionPost()).expect(Status.notFound);
      });

      it("creates question", async () => {
        prismaMock.survey.findUnique.mockResolvedValue(
          basicSurvey({ name: "apple" })
        );
        prismaMock.question.create.mockResolvedValue(basicQuestion());
        const res = await authPost(testPath, basicQuestionPost()).expect(
          Status.created
        );
        basicHateoasTest(res.body);
      });
    });
    it("throws ForbiddenError", async () => {
      prismaMock.guardian.findUnique.mockResolvedValue(null);
      await authPost(testPath, basicQuestionPost()).expect(Status.forbidden);
    });
  });

  describe("GET /", () => {
    const testPath = `${testPrefix}/`;

    it("Resolves answer", async () => {
      prismaMock.survey.findUnique.mockResolvedValue(
        basicSurvey({ name: "apple" })
      );
      prismaMock.question.findMany.mockResolvedValue([]);
      const res = await authGet(testPath).expect(Status.ok);
      expect(res.body).toMatchObject({ references: [] });
      basicHateoasTest(res.body);
    });

    it("Throws error on invalid id", async () => {
      prismaMock.survey.findUnique.mockResolvedValue(null);
      await authGet(testPath).expect(Status.notFound);
    });
  });
});
