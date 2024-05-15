import { Template } from "@prisma/client";
import express, { Router as router, Router } from "express";
import { z } from "zod";
import prisma from "../../../database";
import {
  TemplateHateaos,
  templatePatchSchema,
  templatePostSchema,
} from "../../../types/express/activity";
import { ReferenceHateoas } from "../../../types/express/hateoas";
import { authorizeAtLeastGuardian } from "../../../util/authentication";
import { Prefix, Status } from "../../../util/consts";
import { InvalidParameterError } from "../../../util/errors";
import { basicRespond, makeSchemaEndpoint } from "../../../util/express";
import { UrlBuilder } from "../../../util/urlBuilder";
import {
  asPrismaTemplate,
  asPrismaTemplatePatch,
} from "../../../types/prisma/activity";

export async function findTemplateFromParams(
  templateId: string,
  childId: string
): Promise<Template> {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });
  if (!template) {
    throw new InvalidParameterError("templateId", template);
  }
  if (template.childId !== childId) {
    throw new InvalidParameterError("childId", childId);
  }
  return template;
}

/**
 * @apiDefine AllTemplatesParams
 * @apiParam {String} childId The id of the child
 */
const allTemplatesParamSchema = z.object({
  childId: z.string().uuid(),
});

/**
 * @apiDefine OneTemplateParams
 * @apiParam {String} childId The id of the child
 * @apiParam {String} templateId The id of the template
 */
const oneTemplateParamSchema = allTemplatesParamSchema.extend({
  templateId: z.string().uuid(),
});

export const templateRouter: Router = router();
// Set json middleware
templateRouter.use(express.json({ type: ["application/json"] }));

templateRouter
  .route(`${Prefix.template}/`)
  /**
   * @api {get} /children/:childId/templates Get all templates of child
   * @apiName GetTemplates
   * @apiGroup Templates
   * @apiUse AllTemplatesParams
   * @apiUse ReferenceHateoas
   * @apiUse ForbiddenError
   * @apiUse RequestTypeError
   * @apiUse NotFoundError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: allTemplatesParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const templates = await prisma.template.findMany({
          where: {
            childId: req.params.childId,
          },
        });

        basicRespond(
          res,
          Status.ok,
          new ReferenceHateoas(
            templates.map((template) => {
              return new UrlBuilder()
                .addPrefix(Prefix.template, {
                  childId: req.params.childId,
                })
                .addId(template.id)
                .toCompleteAPIPath();
            }),
            {
              self: new UrlBuilder()
                .addPrefix(Prefix.template, {
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
   * @api {post} /children/:childId/templates Create a template
   * @apiName CreateTemplate
   * @apiGroup Templates
   * @apiUse AllTemplatesParams
   * @apiUse TemplatePostBody
   * @apiUse TemplateSuccess
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
        params: allTemplatesParamSchema,
        body: templatePostSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );
        const created = await prisma.template.create({
          data: asPrismaTemplate(req.body, req.params.childId),
        });

        basicRespond(res, Status.created, new TemplateHateaos(created));
      }
    )
  );

templateRouter
  .route(`${Prefix.template}/:templateId`)
  /**
   * @api {get} /children/:childId/templates/:templateId Get a template
   * @apiName GetTemplate
   * @apiGroup Templates
   * @apiUse TemplateSuccess
   * @apiUse OneTemplateParams
   * @apiUse ForbiddenError
   * @apiUse NotFoundError
   */
  .get(
    makeSchemaEndpoint(
      {
        params: oneTemplateParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const template = await findTemplateFromParams(
          req.params.templateId,
          req.params.childId
        );

        basicRespond(res, Status.ok, new TemplateHateaos(template));
      }
    )
  )
  /**
   * @api {patch} /children/:childId/templates/:templateId Update a template
   * @apiName UpdateTemplate
   * @apiGroup Templates
   * @apiUse OneTemplateParams
   * @apiUse TemplatePatchBody
   * @apiUse TemplateSuccess
   */
  .patch(
    makeSchemaEndpoint(
      {
        params: oneTemplateParamSchema,
        body: templatePatchSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        const template = await prisma.template.update({
          where: {
            id: req.params.templateId,
          },
          data: asPrismaTemplatePatch(req.body, req.params.childId),
        });
        basicRespond(res, Status.ok, new TemplateHateaos(template));
      }
    )
  )
  /**
   * @api {delete} /children/:childId/templates/:templateId Delete a template of child
   * @apiName DeleteTemplate
   * @apiGroup Templates
   * @apiUse OneTemplateParams
   * @apiSuccess (204) NoContent The child was deleted
   * @apiUse NotFoundError
   * @apiUse ForbiddenError
   */
  .delete(
    makeSchemaEndpoint(
      {
        params: oneTemplateParamSchema,
      },
      async (req, res) => {
        await authorizeAtLeastGuardian(
          req.headers.authorization,
          req.params.childId
        );

        await prisma.template.delete({
          where: {
            id: req.params.templateId,
          },
        });
        res.status(Status.noContent).send();
      }
    )
  );
