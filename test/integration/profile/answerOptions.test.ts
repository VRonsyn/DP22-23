import { PrefixBlocks, Status } from "../../../src/util/consts";
import { authGet, authPost } from "../../util/authentication";
import {
  basicAnswerOption,
  basicGuardian,
  basicQuestion,
} from "../../util/prisma/valueCreators";
import { basicHateoasTest } from "../../util/hateoas";
import { prismaMock } from "../../../src/__mocks__/database";
import { basicAnswerOptionPost } from "../../util/prisma/postCreators";

jest.mock("../../../src/middleware/authentication");
jest.mock("../../../src/database");

describe("answerOptions prefixed routes", () => {
  const testPrefix = `/${PrefixBlocks.survey}/banana/${PrefixBlocks.question}/1/${PrefixBlocks.answerOption}`;
  describe("GET /:id", () => {
    const testPath = `${testPrefix}/1`;

    it("Resolves answer", async () => {
      prismaMock.answerOption.findFirst.mockResolvedValue(
        basicAnswerOption({ answer: "apple", id: "1" })
      );
      const res = await authGet(testPath).expect(Status.ok);
      expect(res.body).toMatchObject({
        answer: "apple",
      });
      basicHateoasTest(res.body);
    });

    it("Throws error on invalid id", async () => {
      prismaMock.answerOption.findFirst.mockResolvedValue(null);
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

      it("throws NotFound", async () => {
        prismaMock.question.findFirst.mockResolvedValue(null);
        await authPost(testPath, basicAnswerOptionPost()).expect(
          Status.notFound
        );
      });

      it("creates answerOption", async () => {
        prismaMock.question.findFirst.mockResolvedValue(basicQuestion());
        prismaMock.answerOption.create.mockResolvedValue(basicAnswerOption());
        const res = await authPost(testPath, basicAnswerOptionPost()).expect(
          Status.created
        );
        basicHateoasTest(res.body);
      });

      it("creates with options when asked", async () => {
        const response = basicAnswerOption({ options: { apple: "apple" } });
        prismaMock.question.findFirst.mockResolvedValue(basicQuestion());
        // @ts-ignore
        prismaMock.answerOption.create.mockResolvedValue(response);
        const res = await authPost(
          testPath,
          basicAnswerOptionPost({ options: { apple: "apple" } })
        ).expect(Status.created);
        basicHateoasTest(res.body);
        expect(prismaMock.answerOption.create).toBeCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              options: { apple: "apple" },
            }),
          })
        );
      });
    });

    it("Fails without permission", async () => {
      prismaMock.guardian.findUnique.mockResolvedValue(null);
      await authPost(testPath, basicAnswerOptionPost()).expect(
        Status.forbidden
      );
    });
  });

  describe("GET /", () => {
    const testPath = `${testPrefix}/`;

    it("Resolves answer", async () => {
      prismaMock.question.findFirst.mockResolvedValue(basicQuestion());
      prismaMock.answerOption.findMany.mockResolvedValue([]);
      const res = await authGet(testPath).expect(Status.ok);
      expect(res.body).toMatchObject({ references: [] });
      basicHateoasTest(res.body);
    });

    it("Throws error on invalid id", async () => {
      prismaMock.survey.findFirst.mockResolvedValue(null);
      await authGet(testPath).expect(Status.notFound);
    });
  });
});
