import express, { Router as router, Router } from "express";
import { z } from "zod";
import prisma from "../../../database";
import {
  ClarificationImageHateaos,
  clarificationImagePatchSchema,
  clarificationImagePostSchema,
} from "../../../types/express/activity";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import { authorizeAtLeastGuardian } from "../../../util/authentication";
import { Prefix, Status } from "../../../util/consts";
import { InvalidParameterError } from "../../../util/errors";
import { basicRespond, makeSchemaEndpoint } from "../../../util/express";
import { UrlBuilder } from "../../../util/urlBuilder";
import { ClarificationImage } from "@prisma/client";
import {
  asPrismaClarificationImage,
  asPrismaClarificationImagePatch,
} from "../../../types/prisma/activity";

export async function findClarificationImageFromParams(
  clarificationImageId: string,
  childId: string
): Promise<ClarificationImage> {
  const clarificationImage = await prisma.clarificationImage.findUnique({
    where: { id: clarificationImageId },
  });
  if (!clarificationImage) {
    throw new InvalidParameterError("clarificationImageId", clarificationImage);
  }
  if (clarificationImage.childId !== childId) {
    throw new InvalidParameterError("childId", childId);
  }
  return clarificationImage;
}

/**
 * @apiDefine AllClarificationImageParams
 * @apiParam {String} childId The id of the child
 */
const allClarificationImageParamsSchema = z.object({
  childId: z.string().uuid(),
});

/**
 * @apiDefine OneClarificationImageParams
 * @apiParam {String} childId The id of the child
 * @apiParam {String} clarificationImageId The id of the clarificationImage
 */
const oneClarificationImageParamSchema =
  allClarificationImageParamsSchema.extend({
    clarificationImageId: z.string().uuid(),
  });

export const clarificationImageRouter: Router = router();
// Set json middleware
clarificationImageRouter.use(express.json({ type: ["application/json"] }));

clarificationImageRouter
  .route(`${Prefix.clarificationImage}/`)
  /**
   * @api {get} /children/:childId/clarificationImages Get all clarificationImages of child
   * @apiName GetClarificationImages
   * @apiGroup ClarificationImages
   * @apiUse AllClarificationImageParams
   * @apiSuccess ReferenceHateoas
   * @apiUse ForbiddenError
   * @apiUse RequestTypeError
   * @apiUse NotFoundError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: allClarificationImageParamsSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const clarificationImages = await prisma.clarificationImage.findMany({
          where: {
            childId: req.params.childId,
          },
        });

        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            clarificationImages.map((clarificationImage) => {
              return new UrlBuilder()
                .addPrefix(Prefix.clarificationImage, {
                  childId: req.params.childId,
                })
                .addId(clarificationImage.id)
                .toCompleteAPIPath();
            }),
            {
              self: new UrlBuilder()
                .addPrefix(Prefix.clarificationImage, {
                  childId: req.params.childId,
                })
                .toCompleteAPIPath(),
            }
          )
        );
      }
    )
  )
  /**
   * @api {post} /children/:childId/clarificationImages Create a clarificationImage
   * @apiName CreateClarificationImage
   * @apiGroup ClarificationImages
   * @apiUse AllClarificationImageParams
   * @apiUse ClarificationImagePostBody
   * @apiUse ClarificationImageSuccess
   * @apiUse ForbiddenError
   * @apiUse InvalidReferenceError
   * @apiUse RequestTypeError
   * @apiUse IdUrlParseError
   * @apiUse NotFoundError
   * @apiUse ConflictError
   */
  .post(
    makeSchemaEndpoint(
      {
        params: allClarificationImageParamsSchema,
        body: clarificationImagePostSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );
        const created = await prisma.clarificationImage.create({
          data: asPrismaClarificationImage(req.body, req.params.childId),
        });

        basicRespond(
          res,
          Status.created,
          new ClarificationImageHateaos(created)
        );
      }
    )
  );

clarificationImageRouter
  .route(`${Prefix.clarificationImage}/:clarificationImageId`)
  /**
   * @api {get} /children/:childId/clarificationImages/:clarificationImageId Get a clarificationImage
   * @apiName GetClarificationImage
   * @apiGroup ClarificationImages
   * @apiUse OneClarificationImageParams
   * @apiUse ForbiddenError
   * @apiUse NotFoundError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: oneClarificationImageParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const clarificationImage = await findClarificationImageFromParams(
          req.params.clarificationImageId,
          req.params.childId
        );

        basicRespond(
          res,
          Status.ok,
          new ClarificationImageHateaos(clarificationImage)
        );
      }
    )
  )
  /**
   * @api {patch} /children/:childId/clarificationImages/:clarificationImageId Update a clarificationImage
   * @apiName UpdateClarificationImage
   * @apiGroup ClarificationImages
   * @apiUse OneClarificationImageParams
   * @apiUse ClarificationImagePatchBody
   * @apiUse ClarificationImageSuccess
   *
   */
  .patch(
    makeSchemaEndpoint(
      {
        params: oneClarificationImageParamSchema,
        body: clarificationImagePatchSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const clarificationImage = await prisma.clarificationImage.update({
          where: {
            id: req.params.clarificationImageId,
          },
          data: asPrismaClarificationImagePatch(req.body, req.params.childId),
        });
        basicRespond(
          res,
          Status.ok,
          new ClarificationImageHateaos(clarificationImage)
        );
      }
    )
  )
  /**
   * @api {delete} /children/:childId/clarificationImages/:clarificationImageId Delete a clarificationImage
   * @apiName DeleteClarificationImage
   * @apiGroup ClarificationImages
   * @apiUse OneClarificationImageParams
   * @apiSuccess (204) NoContent The child was deleted
   * @apiUse NotFoundError
   * @apiUse ForbiddenError
   */
  .delete(
    makeSchemaEndpoint(
      {
        params: oneClarificationImageParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        await prisma.clarificationImage.delete({
          where: {
            id: req.params.clarificationImageId,
          },
        });
        res.status(Status.noContent).send();
      }
    )
  );
