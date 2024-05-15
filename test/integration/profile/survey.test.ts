import { authGet, authPost } from "../../util/authentication";
import { Prefix, Status } from "../../../src/util/consts";
import { basicGuardian, basicSurvey } from "../../util/prisma/valueCreators";
import { basicHateoasTest } from "../../util/hateoas";
import { prismaMock } from "../../../src/__mocks__/database";
import { basicSurveyPost } from "../../util/prisma/postCreators";
import { ServerRole, SurveyType } from "@prisma/client";
import { toIdUrl } from "../../../src/util/serialization";

jest.mock("../../../src/middleware/authentication");
jest.mock("../../../src/database");

describe("Question prefixed routes", () => {
  describe("GET /:surveyName", () => {
    const testPath = `${Prefix.survey}/apple`;
    it("Throws InvalidParameterError", async () => {
      prismaMock.survey.findUnique.mockResolvedValue(null);
      await authGet(testPath).expect(Status.notFound);
    });

    it("Resolves answer", async () => {
      prismaMock.survey.findUnique.mockResolvedValue(
        basicSurvey({ name: "apple" })
      );
      const res = await authGet(testPath).expect(Status.ok);
      basicHateoasTest(res.body);
    });
  });

  describe("GET /recent", () => {
    const testPath = `${Prefix.survey}/recent`;

    it("throws NotFoundError", async () => {
      prismaMock.survey.findFirst.mockResolvedValue(null);
      await authGet(testPath).expect(Status.notFound);
    });

    it("Resolves to most recent survey", async () => {
      prismaMock.survey.findFirst.mockResolvedValue(basicSurvey());
      const res = await authGet(testPath).expect(Status.ok);
      basicHateoasTest(res.body);
    });
  });

  describe("Route /", () => {
    const testPath = `${Prefix.survey}/`;
    describe("GET", () => {
      it("Resolves to no surveys if there are none", async () => {
        prismaMock.survey.findMany.mockResolvedValue([]);
        const res = await authGet(testPath).expect(Status.ok);
        basicHateoasTest(res.body);
        expect(res.body).toMatchObject({ references: [] });
      });

      it("Resolves to one survey if there is only one", async () => {
        prismaMock.survey.findMany.mockResolvedValue([basicSurvey()]);
        const res = await authGet(testPath).expect(Status.ok);
        basicHateoasTest(res.body);
        expect(res.body).toMatchObject({
          references: [toIdUrl(basicSurvey().name, Prefix.survey)],
        });
      });

      it("Resolves to all surveys", async () => {
        prismaMock.survey.findMany.mockResolvedValue([
          basicSurvey({ name: "first" }),
          basicSurvey({ name: "second" }),
          basicSurvey({ name: "third" }),
        ]);
        const res = await authGet(testPath).expect(Status.ok);
        basicHateoasTest(res.body);
        expect(res.body).toMatchObject({
          references: [
            toIdUrl("first", Prefix.survey),
            toIdUrl("second", Prefix.survey),
            toIdUrl("third", Prefix.survey),
          ],
        });
      });

      describe("FILTER on type", () => {
        describe("type = QUESTIONNAIRE", () => {
          const testPath = `${Prefix.survey}/?surveyType=QUESTIONNAIRE`;

          afterEach(() => {
            expect(prismaMock.survey.findMany).toBeCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  surveyType: SurveyType.QUESTIONNAIRE,
                }),
              })
            );
          });

          it("gives no survey if there are none", async () => {
            prismaMock.survey.findMany.mockResolvedValue([]);
            const res = await authGet(testPath).expect(Status.ok);
            basicHateoasTest(res.body);
            expect(res.body).toMatchObject({ references: [] });
          });

          it("gives all surveys if only questionnaire", async () => {
            prismaMock.survey.findMany.mockResolvedValue([
              basicSurvey({
                name: "first",
                surveyType: SurveyType.QUESTIONNAIRE,
              }),
              basicSurvey({
                name: "second",
                surveyType: SurveyType.QUESTIONNAIRE,
              }),
            ]);
            const res = await authGet(testPath).expect(Status.ok);
            basicHateoasTest(res.body);
            expect(res.body).toMatchObject({
              references: [
                toIdUrl("first", Prefix.survey),
                toIdUrl("second", Prefix.survey),
              ],
            });
          });
        });

        describe("type = FEEDBACK", () => {
          const testPath = `${Prefix.survey}/?surveyType=FEEDBACK`;

          afterEach(() => {
            expect(prismaMock.survey.findMany).toBeCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({
                  surveyType: SurveyType.FEEDBACK,
                }),
              })
            );
          });

          it("gives no survey if there are none", async () => {
            prismaMock.survey.findMany.mockResolvedValue([]);
            const res = await authGet(testPath).expect(Status.ok);
            basicHateoasTest(res.body);
            expect(res.body).toMatchObject({ references: [] });
          });

          it("gives all surveys if only feedback", async () => {
            prismaMock.survey.findMany.mockResolvedValue([
              basicSurvey({ name: "first", surveyType: SurveyType.FEEDBACK }),
              basicSurvey({ name: "second", surveyType: SurveyType.FEEDBACK }),
            ]);
            const res = await authGet(testPath).expect(Status.ok);
            basicHateoasTest(res.body);
            expect(res.body).toMatchObject({
              references: [
                toIdUrl("first", Prefix.survey),
                toIdUrl("second", Prefix.survey),
              ],
            });
          });
        });
      });

      describe("filter on locale", () => {
        it("detects invalid locale", async () => {
          await authGet(`${testPath}?language=invalid`).expect(
            Status.badRequest
          );
        });

        it("gives survey on valid locale", async () => {
          prismaMock.survey.findMany.mockResolvedValue([basicSurvey()]);
          const res = await authGet(`${testPath}?language=en`).expect(
            Status.ok
          );
          basicHateoasTest(res.body);
          expect(res.body).toMatchObject({
            references: [toIdUrl(basicSurvey().name, Prefix.survey)],
          });
          expect(prismaMock.survey.findMany).toBeCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                language: "en",
              }),
            })
          );
        });
      });
    });

    describe("POST", () => {
      describe("With permission", () => {
        beforeEach(() => {
          // Handle authorization
          prismaMock.guardian.findUnique.mockResolvedValue(
            basicGuardian({ serverRole: "ADMIN" })
          );
        });

        it("throws NotUniqueError", async () => {
          prismaMock.survey.findUnique.mockResolvedValue(basicSurvey());
          await authPost(testPath, basicSurveyPost()).expect(Status.conflict);
        });

        it("throws RequestTypeError", async () => {
          prismaMock.survey.findUnique.mockResolvedValue(null);
          await authPost(testPath, { name: "apple" }).expect(Status.badRequest);
        });

        it("Resolves to created survey", async () => {
          prismaMock.survey.findUnique.mockResolvedValue(null);
          prismaMock.survey.create.mockResolvedValue(basicSurvey());
          const res = await authPost(testPath, basicSurveyPost()).expect(
            Status.created
          );
          basicHateoasTest(res.body);
        });
      });

      it("Throws ForbiddenError", async () => {
        prismaMock.guardian.findUnique.mockResolvedValue(
          basicGuardian({ serverRole: ServerRole.GUARDIAN })
        );
        await authPost(testPath, basicSurveyPost()).expect(Status.forbidden);
      });
    });
  });
});
