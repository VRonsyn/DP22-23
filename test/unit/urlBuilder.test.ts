import { Prefix } from "../../src/util/consts";
import { UrlBuilder } from "../../src/util/urlBuilder";
import { getEnv } from "../../src/util/dotEnvHandling";

describe("urlBuilder", () => {
  const baseUrl = getEnv().HOST;
  it("can build without parameters", () => {
    expect(new UrlBuilder().toCompleteAPIPath()).toEqual(baseUrl);
  });
  it("can build with root prefix", () => {
    expect(
      new UrlBuilder().addPrefix(Prefix.home, {}).toCompleteAPIPath()
    ).toEqual(`${baseUrl}/`);
  });
  it("can build with account prefix", () => {
    expect(
      new UrlBuilder().addPrefix(Prefix.account, {}).toCompleteAPIPath()
    ).toEqual(`${baseUrl}/account`);
  });
  it("can build activities with childId prefix", () => {
    const childId = "123";
    expect(
      new UrlBuilder()
        .addPrefix(Prefix.activity, { childId })
        .toCompleteAPIPath()
    ).toEqual(`${baseUrl}/children/${childId}/activities`);
  });
  it("can build answerOption with surveyName and questionId prefix", () => {
    const replace = {
      surveyName: "Large Questionnaire",
      questionId: "1234",
    };
    expect(
      new UrlBuilder()
        .addPrefix(Prefix.answerOption, replace)
        .toCompleteAPIPath()
    ).toEqual(
      encodeURI(
        `${baseUrl}/surveys/${replace.surveyName}/questions/${replace.questionId}/answerOptions`
      )
    );
  });
});
