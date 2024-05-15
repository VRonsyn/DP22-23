import { Status } from "../../src/util/consts";
import { authGet } from "../util/authentication";

jest.mock("../../src/middleware/authentication");

describe("home path", () => {
  it("resolves", async () => {
    const res = await authGet("/").expect(Status.ok);
    expect(res.body).toMatchObject({ name: "hello world!" });
  });
});
