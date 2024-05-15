import { Prefix } from "../../util/consts";
import { toCompleteAPIPath } from "../../util/serialization";

/**
 * @apiDefine Hateoas
 * @apiSuccess {Object} _links The links to the linked resources
 * @apiSuccess {String} _links.self The link to the current resource
 * @apiSuccess {Object} _quickLinks The links to known resources
 * @apiSuccess {String} _quickLinks.home The link to the home page
 * @apiSuccess {String} _quickLinks.children The link to the children page
 * @apiSuccess {String} _quickLinks.surveys The link to the surveys page
 * @apiSuccess {String} _quickLinks.profile The link to the profile page
 */
export abstract class Hateoas<T, Q extends Record<string, unknown>> {
  protected abstract data: T;

  // (keyof T)[], list of keys of T that reference other resources. (Seems like TS infers this)
  protected abstract referenceFields: string[];

  protected abstract dataExpander(data: T): Q;

  public toJSON(): object {
    return {
      ...objectCleansing(this.dataExpander(this.data), {
        referenceFields: this.referenceFields as string[],
      }),
      _links: {
        ...this._linksCreator(),
      },
      _quickLinks: {
        home: toCompleteAPIPath(Prefix.home),
        children: toCompleteAPIPath(Prefix.child),
        surveys: toCompleteAPIPath(Prefix.survey),
        profile: toCompleteAPIPath(Prefix.account),
      },
    };
  }

  protected abstract _linksCreator(): Record<string, string> & { self: string };
}

export abstract class SimpleHateoas<
  T extends Record<string, unknown>
> extends Hateoas<T, T> {
  protected dataExpander(data: T): T {
    return data;
  }
}

/**
 * @apiDefine ReferenceHateoas
 * @apiUse Hateoas
 * @apiSuccess {String[]} references The list of references
 */
export class ReferenceHateoas extends Hateoas<
  string[],
  { references: string[] }
> {
  public referenceFields: string[] = [];
  public constructor(
    protected data: string[],
    private links: Record<string, string> & { self: string }
  ) {
    super();
  }

  protected dataExpander(data: string[]): { references: string[] } {
    return {
      references: data,
    };
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return this.links;
  }
}

export class CustomHateoas<
  T extends Record<string, unknown>
> extends SimpleHateoas<T> {
  public data: T;
  public referenceFields: string[] = [];
  private readonly links: Record<string, string> & { self: string };

  public constructor(
    data: T,
    links: Record<string, string> & { self: string }
  ) {
    super();
    this.data = data;
    this.referenceFields = [];
    this.links = links;
  }

  protected dataExpander(data: T): T {
    return data;
  }

  protected _linksCreator(): Record<string, string> & { self: string } {
    return this.links;
  }
}

export function objectCleansing(
  obj: object,
  options?: {
    idRemoval?: boolean;
    referenceFields?: string[];
  }
): object {
  const defOptions = {
    idRemoval: options?.idRemoval === undefined ? true : options.idRemoval,
    referenceFields: options?.referenceFields || [],
  };
  const copy = { ...obj };
  for (const filter of defOptions.referenceFields) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (copy[filter]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete copy[filter];
    }
    if (filter.includes(".")) {
      const split = filter.split(".");
      let current = copy;
      let key;
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      for (key of split.slice(0, split.length - 1)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (current[key]) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          current = current[key];
        } else {
          break;
        }
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete current[split.pop()];
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (defOptions.idRemoval && copy.id) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete copy.id;
  }
  return copy;
}
