import { Prefix } from "./consts";
import { toCompleteAPIPath } from "./serialization";

type IsParameter<Part> = Part extends `:${infer ParamName}` ? ParamName : never;
type FilteredParts<Path> = Path extends `${infer PartA}/${infer PartB}`
  ? IsParameter<PartA> | FilteredParts<PartB>
  : IsParameter<Path>;
type Params<Path> = {
  [Key in FilteredParts<Path>]: string;
};

/**
 * This class is used to build urls.
 * @example
 * const url = new UrlBuilder().addPrefix(Prefix.home).toCompleteAPIPath();
 * // url = "http://localhost:3000/"
 * @example
 * const url = new UrlBuilder().addPrefix(Prefix.account).toCompleteAPIPath();
 * // url = "http://localhost:3000/account"
 */
export class UrlBuilder {
  /**
   * All parts of the url are stored in this array.
   */
  private parts: string[];

  constructor() {
    this.parts = [];
  }

  /**
   * Adds an id to the url.
   * @param id The id to add.
   * @returns The UrlBuilder.
   * @example
   * const url = new UrlBuilder().addId("123").toCompleteAPIPath();
   * // url = "https://api.example.com/123"
   */
  public addId(id: string): UrlBuilder {
    this.parts.push(id);
    return this;
  }

  /**
   * Add a prefix to the url.
   * @param prefix
   * @param params
   */
  public addPrefix<P extends Prefix>(prefix: P, params: Params<P>): UrlBuilder {
    let replaced: string = prefix;
    for (const key of Object.keys(params) as Array<keyof Params<P>>) {
      replaced = replaced.replace(`:${key}`, params[key]);
    }
    this.parts.push(replaced);
    return this;
  }

  /**
   * Return the complete url.
   * @returns The complete url.
   * @example
   * const url = new UrlBuilder().addPrefixBlock(PrefixBlocks.survey).addId("Large Questionnaire").addPrefixBlock(PrefixBlocks.question).addId("1234").addPrefixBlock(PrefixBlocks.answerOption).toCompleteAPIPath();
   * // url = "https://api.example.com/surveys/Large%20Questionnaire/questions/1234/answerOptions"
   */
  public toCompleteAPIPath(): string {
    let path = this.parts.join("/");
    if (path.length > 0 && !path.startsWith("/")) {
      path = `/${path}`;
    }
    return toCompleteAPIPath(path);
  }
}
