import { objectCleansing } from "../../../src/types/express/hateoas";

describe("objectCleansing", () => {
  it("clean simple object", () => {
    expect(
      objectCleansing(
        { a: "apple", b: "banana", c: "carrot" },
        { idRemoval: true, referenceFields: ["a", "b"] }
      )
    ).toEqual({ c: "carrot" });
  });

  it("clean object with nested object (1 level)", () => {
    expect(
      objectCleansing(
        { a: "apple", b: "banana", c: { d: "dragon fruit", e: "eggplant" } },
        { idRemoval: true, referenceFields: ["a", "b", "c.d"] }
      )
    ).toEqual({ c: { e: "eggplant" } });
  });

  it("clean object with nested object (multiple level)", () => {
    expect(
      objectCleansing(
        {
          a: "apple",
          b: "banana",
          c: {
            d: "dragon fruit",
            f: { g: "grapes", h: "hazelnuts", i: { j: { k: "kiwi" } } },
          },
        },
        { idRemoval: true, referenceFields: ["a", "c.f.h", "c.f.i.j.k"] }
      )
    ).toEqual({
      b: "banana",
      c: {
        d: "dragon fruit",
        f: { g: "grapes", i: { j: {} } },
      },
    });
  });

  it("Skip invalid reference fields", () => {
    expect(
      objectCleansing(
        { a: "apple", b: "banana", c: { d: "dragon fruit", e: "eggplant" } },
        { idRemoval: true, referenceFields: ["z", "z.d", "c.z", "c.d.x.y.z"] }
      )
    ).toEqual({
      a: "apple",
      b: "banana",
      c: { d: "dragon fruit", e: "eggplant" },
    });
  });
});
