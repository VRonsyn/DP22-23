import { authGet } from "../util/authentication";
import { Status } from "../../src/util/consts";

describe("Authentication", () => {
  it("Invalid token", async () => {
    await authGet("/").expect(Status.unauthorized);
  });
});
