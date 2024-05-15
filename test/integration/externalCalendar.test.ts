import { PrefixBlocks, Status } from "../../src/util/consts";
import {
  authDelete,
  authGet,
  authPatch,
  authPost,
} from "../util/authentication";
import { basicExternalCalendar } from "../util/prisma/valueCreators";
import { basicHateoasTest } from "../util/hateoas";
import { prismaMock } from "../../src/__mocks__/database";
import { basicExternalCalendarPost } from "../util/prisma/postCreators";
import { toExternalCalendarIdUrl } from "../../src/util/serialization";

jest.mock("../../src/middleware/authentication");
jest.mock("../../src/database");

describe("ExternalCalendar prefixed routes", () => {
  const guardianId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const externalCalendarId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const testPrefix = `/${PrefixBlocks.account}/${guardianId}/${PrefixBlocks.externalCalendar}`;

  describe("GET /:id", () => {
    const testPath = `${testPrefix}/${externalCalendarId}`;

    it("Resolves externalCalendar", async () => {
      prismaMock.externalCalendar.findUnique.mockResolvedValue(
        basicExternalCalendar()
      );
      const res = await authGet(testPath).expect(Status.ok);
      basicHateoasTest(res.body);
    });

    it("Throws error on invalid id", async () => {
      prismaMock.question.findUnique.mockResolvedValue(null);
      await authGet(testPath).expect(Status.notFound);
    });

    it("Throws error if guardianId is not id in externalCalendar", async () => {
      prismaMock.externalCalendar.findUnique.mockResolvedValue(
        basicExternalCalendar({
          guardianId: "bd37ce4e-623e-437a-95e2-dd2e5133ce74",
        })
      );
      await authGet(testPath).expect(Status.notFound);
    });
  });

  describe("POST /", () => {
    const testPath = `${testPrefix}/`;

    it("throws RequestTypeError", async () => {
      await authPost(testPath, { apple: "apple" }).expect(Status.badRequest);
    });

    it("throws RequestTypeError on invalid color string", async () => {
      await authPost(
        testPath,
        basicExternalCalendarPost({
          color: "apple",
        })
      ).expect(Status.badRequest);
    });

    it("creates ExternalCalendar", async () => {
      prismaMock.externalCalendar.create.mockResolvedValue(
        basicExternalCalendar()
      );
      const res = await authPost(testPath, basicExternalCalendarPost()).expect(
        Status.created
      );
      basicHateoasTest(res.body);
      expect(prismaMock.externalCalendar.create).toHaveBeenCalled();
    });
  });

  describe("PATCH /:id", () => {
    const testPath = `${testPrefix}/ad37ce4e-623e-437a-95e2-dd2e5133ce74`;

    it("throws RequestTypeError", async () => {
      await authPatch(testPath, { apple: "apple" }).expect(Status.badRequest);
    });

    it("updates ExternalCalendar", async () => {
      prismaMock.externalCalendar.update.mockResolvedValue(
        basicExternalCalendar()
      );
      const res = await authPatch(testPath, basicExternalCalendarPost()).expect(
        Status.ok
      );
      basicHateoasTest(res.body);
      expect(prismaMock.externalCalendar.update).toHaveBeenCalled();
    });
  });

  describe("GET /", () => {
    const testPath = `${testPrefix}/`;

    it("Resolves externalCalendars", async () => {
      prismaMock.externalCalendar.findMany.mockResolvedValue([
        basicExternalCalendar(),
      ]);
      const res = await authGet(testPath).expect(Status.ok);
      expect(res.body).toMatchObject({
        references: [toExternalCalendarIdUrl(guardianId, externalCalendarId)],
      });
      basicHateoasTest(res.body);
    });
  });
  describe("DELETE /:id", () => {
    const testPath = `${testPrefix}/ad37ce4e-623e-437a-95e2-dd2e5133ce74`;

    it("deletes ExternalCalendar", async () => {
      prismaMock.externalCalendar.delete.mockResolvedValue(
        basicExternalCalendar()
      );
      await authDelete(testPath).expect(Status.noContent);
      expect(prismaMock.externalCalendar.delete).toHaveBeenCalled();
    });
  });
});
