import { Router as router } from "express";
import { toCompleteAPIPath } from "../../util/serialization";
import { Prefix, Status } from "../../util/consts";
import { basicRespond } from "../../util/express";
import { CustomHateoas } from "../../types/express/hateoas";

export const homeRouter: router = router();

/**
 * @api {get} / Get home
 * @apiName GetHome
 * @apiGroup Home
 * @apiSuccess {String} name Some random text
 * @apiUse Hateoas
 */
homeRouter.get(`${Prefix.home}/`, async (req, res) => {
  basicRespond(
    res,
    Status.ok,
    new CustomHateoas(
      { name: "hello world!" },
      { self: toCompleteAPIPath(Prefix.home) }
    )
  );
});
