import { parseAbsolutePath } from "../../../src/util/parser";

describe("parseAbsolutePath", () => {
  it("parses a path without http prefix", () => {
    expect(
      parseAbsolutePath("example.com/abc/def", "example.com/:apple/:pear", [
        "apple",
      ])
    ).toEqual({
      apple: "abc",
    });
  });

  it("parses a path with multiple parameters", () => {
    expect(
      parseAbsolutePath(
        "https://example.com/abc/def",
        "https://example.com/:apple/:pear",
        ["apple", "pear"]
      )
    ).toEqual({ apple: "abc", pear: "def" });
  });
});
