import { PrefixBlocks, Status } from "../../../src/util/consts";
import { authGet, authPost } from "../../util/authentication";
import {
  basicAnswerOption,
  basicChild,
  basicChildAccessRelation,
  basicQuestion,
  basicSubmittedSurvey,
  basicSubmittedSurveyAnswer,
  basicSurvey,
} from "../../util/prisma/valueCreators";
import { basicHateoasTest } from "../../util/hateoas";
import { prismaMock } from "../../../src/__mocks__/database";
import { basicSubmittedSurveyPost } from "../../util/prisma/postCreators";
import { toSubmittedSurveyIdUrl } from "../../../src/util/serialization";
import prisma from "../../../src/database";

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

describe("SubmittedSurvey prefixed routes", () => {
  const childId = "1";
  const testPrefix = `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.submittedSurvey}`;

  describe("GET /:id", () => {
    const testPath = `${testPrefix}/1`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves answer", async () => {
        prismaMock.submittedSurvey.findFirst.mockResolvedValue(
          basicSubmittedSurvey()
        );
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
          basicSubmittedSurveyPost({ surveyUrl: "badUrl" })
        ).expect(Status.badRequest);
      });

      it("throws InvalidReferenceError", async () => {
        prismaMock.survey.findUnique.mockResolvedValue(null);
        await authPost(testPath, basicSubmittedSurveyPost()).expect(
          Status.badRequest
        );
      });

      it("creates SubmittedSurvey", async () => {
        prismaMock.survey.findUnique.mockResolvedValue(
          basicSurvey({ name: "apple" })
        );
        prismaMock.submittedSurvey.create.mockResolvedValue(
          basicSubmittedSurvey()
        );
        const res = await authPost(testPath, basicSubmittedSurveyPost()).expect(
          Status.created
        );
        basicHateoasTest(res.body);
        expect(prismaMock.submittedSurvey.create).toHaveBeenCalled();
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPost(testPath, basicSubmittedSurveyPost()).expect(
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
        prismaMock.submittedSurvey.findMany.mockResolvedValue([
          basicSubmittedSurvey(),
        ]);
        const res = await authGet(testPath).expect(Status.ok);
        expect(res.body).toMatchObject({
          references: [
            toSubmittedSurveyIdUrl(childId, basicSubmittedSurvey().id),
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

  describe("POST /:id/postResultedSettings", () => {
    const testPath = `${testPrefix}/2/${PrefixBlocks.postResultedSettings}`;

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });

      it("Resolves answer", async () => {
        const submittedSurveyResponse = {
          ...basicSubmittedSurvey(),
          answers: [
            {
              ...basicSubmittedSurveyAnswer(),
              answerOption: basicAnswerOption(),
            },
          ],
          survey: {
            ...basicSurvey(),
            questions: [basicQuestion()],
          },
        };
        prismaMock.submittedSurvey.findFirst.mockResolvedValue(
          submittedSurveyResponse
        );
        prismaMock.child.update.mockResolvedValue(basicChild());

        const response = await authPost(testPath, {});
        expect(response.status).toBe(Status.found);
      });

      it("throws conflict", async () => {
        const submittedSurveyResponse = {
          ...basicSubmittedSurvey(),
          answers: [],
          survey: {
            ...basicSurvey(),
            questions: [basicQuestion()],
          },
        };
        prismaMock.submittedSurvey.findFirst.mockResolvedValue(
          submittedSurveyResponse
        );
        prismaMock.child.update.mockResolvedValue(basicChild());

        const response = await authPost(testPath, {});
        expect(response.status).toBe(Status.conflict);
      });

      it("throws notFound", async () => {
        prismaMock.submittedSurvey.findFirst.mockResolvedValue(null);

        const response = await authPost(testPath, {});
        expect(response.status).toBe(Status.notFound);
      });
    });

    it("throws ForbiddenError", async () => {
      withoutPermission();
      await authPost(testPath, {}).expect(Status.forbidden);
    });
  });
});
