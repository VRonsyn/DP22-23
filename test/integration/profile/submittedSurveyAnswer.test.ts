import { PrefixBlocks, Status } from "../../../src/util/consts";
import { authGet, authPost } from "../../util/authentication";
import {
  basicAnswerOption,
  basicChildAccessRelation,
  basicQuestion,
  basicSubmittedSurvey,
  basicSubmittedSurveyAnswer,
} from "../../util/prisma/valueCreators";
import { basicHateoasTest } from "../../util/hateoas";
import { prismaMock } from "../../../src/__mocks__/database";
import { basicSubmittedSurveyAnswerPost } from "../../util/prisma/postCreators";
import { toSubmittedSurveyAnswerIdUrl } from "../../../src/util/serialization";
import { SubmittedSurveyAnswer } from "@prisma/client";

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

describe("SubmittedSurveyAnswer prefixed routes", () => {
  const childId = "1";
  const submittedSurveyId = "1";
  const testPrefix = `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.submittedSurvey}/${submittedSurveyId}/${PrefixBlocks.submittedSurveyAnswer}`;

  describe("GET /:id", () => {
    const testPath = `${testPrefix}/1`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves answer", async () => {
        prismaMock.submittedSurveyAnswer.findFirst.mockResolvedValue({
          answerOption: {
            question: basicQuestion(),
            ...basicAnswerOption(),
          },
          ...basicSubmittedSurveyAnswer(),
        } as SubmittedSurveyAnswer);
        const res = await authGet(testPath).expect(Status.ok);
        basicHateoasTest(res.body);
      });

      it("Throws error on invalid id", async () => {
        prismaMock.question.findFirst.mockResolvedValue(null);
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
          basicSubmittedSurveyAnswerPost({ answerOptionUrl: "badUrl" })
        ).expect(Status.badRequest);
      });

      it("throws InvalidReferenceError", async () => {
        prismaMock.answerOption.findFirst.mockResolvedValue(null);
        await authPost(testPath, basicSubmittedSurveyAnswerPost()).expect(
          Status.badRequest
        );
        expect(prismaMock.answerOption.findFirst).toHaveBeenCalled();
      });

      it("throws NotFoundError", async () => {
        prismaMock.answerOption.findFirst.mockResolvedValue(
          basicAnswerOption()
        );
        prismaMock.submittedSurvey.findFirst.mockResolvedValue(null);
        await authPost(testPath, basicSubmittedSurveyAnswerPost()).expect(
          Status.notFound
        );
        expect(prismaMock.submittedSurvey.findFirst).toBeCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              surveyName: "appleOrPear",
            }),
          })
        );
      });

      it("creates SubmittedSurveyAnswer", async () => {
        prismaMock.answerOption.findFirst.mockResolvedValue(
          basicAnswerOption()
        );
        prismaMock.submittedSurvey.findFirst.mockResolvedValue(
          basicSubmittedSurvey()
        );
        prismaMock.submittedSurveyAnswer.create.mockResolvedValue(
          basicSubmittedSurveyAnswer()
        );
        const res = await authPost(
          testPath,
          basicSubmittedSurveyAnswerPost()
        ).expect(Status.created);
        basicHateoasTest(res.body);
        expect(prismaMock.submittedSurveyAnswer.create).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPost(testPath, basicSubmittedSurveyAnswerPost()).expect(
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

      it("Resolves answer", async () => {
        prismaMock.submittedSurveyAnswer.findMany.mockResolvedValue([
          basicSubmittedSurveyAnswer(),
        ]);
        const res = await authGet(testPath).expect(Status.ok);
        expect(res.body).toMatchObject({
          references: [
            toSubmittedSurveyAnswerIdUrl(
              childId,
              submittedSurveyId,
              basicSubmittedSurvey().id
            ),
          ],
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
