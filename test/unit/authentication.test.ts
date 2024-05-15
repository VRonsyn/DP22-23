import { TEST_ACCESS_TOKEN, TEST_AUTH0_ID } from "../util/authentication";
import {
  authorizeAsAdmin,
  getUserAuth0Id,
} from "../../src/util/authentication";
import { prismaMock } from "../../src/__mocks__/database";
import { basicGuardian } from "../util/prisma/valueCreators";
import { ServerRole } from "@prisma/client";

jest.mock("../../src/database");
describe("authentication", () => {
  it("get email from token", () => {
    expect(getUserAuth0Id(TEST_ACCESS_TOKEN)).toEqual("auth0|test");
  });

  it("is admin", async () => {
    prismaMock.guardian.findUnique.mockResolvedValue(
      basicGuardian({ auth0Id: TEST_AUTH0_ID, serverRole: ServerRole.ADMIN })
    );
    await expect(() => authorizeAsAdmin(TEST_ACCESS_TOKEN)).resolves;
  });

  it("is not admin", async () => {
    prismaMock.guardian.findUnique.mockResolvedValue(
      basicGuardian({ auth0Id: TEST_AUTH0_ID })
    );
    await expect(() => authorizeAsAdmin(TEST_ACCESS_TOKEN)).rejects.toThrow();
  });
});
