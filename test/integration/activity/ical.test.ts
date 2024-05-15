import { PrefixBlocks, Status } from "../../../src/util/consts";
import { authGet } from "../../util/authentication";
import {
  basicActivity,
  basicChild,
  basicChildAccessRelation,
  basicTemplate,
} from "../../util/prisma/valueCreators";
import { prismaMock } from "../../../src/__mocks__/database";

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

describe("Activity prefixed routes", () => {
  const childId = "ad37ce4e-623e-437a-95e2-dd2e5133ce74";
  const testPrefix = `/${PrefixBlocks.child}/${childId}/${PrefixBlocks.ical}`;

  describe("GET /", () => {
    const testPath = `${testPrefix}/`;

    async function test() {
      prismaMock.child.findUnique.mockResolvedValue(basicChild());
      const activitiesResponse = [
        { ...basicActivity(), template: { ...basicTemplate(), tasks: [] } },
      ];
      prismaMock.activity.findMany.mockResolvedValue(activitiesResponse);
      const res = await authGet(testPath).expect(Status.ok);
      expect(res.type).toBe("text/calendar");
    }

    describe("with permission", () => {
      beforeEach(() => {
        withPermission();
      });
      it("Resolves as-ical-format", async () => {
        await test();
      });

      it("throws NotFoundError", async () => {
        prismaMock.activity.findMany.mockRejectedValue(
          new Error("Some prisma error")
        );
        await authGet(testPath).expect(Status.notFound);
      });
    });

    it("Works without permission", async () => {
      withoutPermission();
      await test();
    });
  });
});
