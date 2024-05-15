import { Prefix } from "../../src/util/consts";
import { getEnv } from "../../src/util/dotEnvHandling";
import { toCompleteAPIPath } from "../../src/util/serialization";

export function basicHateoasTest(body: object) {
  expect(body).toHaveProperty("_links.self");
  expect(body).toHaveProperty("_quickLinks");

  expect(body).toEqual(
    expect.objectContaining({
      _links: expect.objectContaining({
        self: expect.stringContaining(getEnv().HOST),
      }),
      _quickLinks: expect.objectContaining({
        home: toCompleteAPIPath(Prefix.home),
        surveys: toCompleteAPIPath(Prefix.survey),
      }),
    })
  );
}
