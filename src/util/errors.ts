import { Status } from "./consts";

export class ClientError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * @apiDefine BadRequestError
 * @apiError BadRequest The request is invalid.
 * @apiErrorExample {json} BadRequestError-Response:
 * HTTP/1.1 400 BAD REQUEST
 * {
 * "message": "The request is invalid."
 * }
 */
export class BadRequest extends ClientError {
  constructor(message: string) {
    super(message, Status.badRequest);
  }
}

/**
 * @apiDefine ConflictError
 * @apiError ConflictError The request conflicts with the current state of the server.
 * @apiErrorExample {json} ConflictError-Response:
 * HTTP/1.1 409 CONFLICT
 * {
 * "message": "The request conflicts with the current state of the server."
 * }
 */
export class ConflictError extends ClientError {
  constructor(
    message = "The request conflicts with the current state of the server."
  ) {
    super(message, Status.conflict);
  }
}

/**
 * @apiDefine ForbiddenError
 * @apiError ForbiddenError The user has no access this resource.
 * @apiErrorExample {json} ForbiddenError-Response:
 *  HTTP/1.1 403 FORBIDDEN
 *  {
 *  "message": "You are not authorized to access this resource"
 *  }
 */
export class ForbiddenError extends ClientError {
  constructor(message: string) {
    super(message, Status.forbidden);
  }
}

/**
 * @apiDefine NotFoundError
 * @apiError NotFoundError The requested resource was not found.
 * @apiErrorExample {json} NotFoundError-Response:
 *  HTTP/1.1 404 Not Found
 *  {
 *  "message": "The requested resource was not found."
 *  }
 */
export class NotFoundError extends ClientError {
  constructor(message: string) {
    super(message, Status.notFound);
  }
}

/**
 * @apiDefine InvalidParameterError
 *
 * @apiError InvalidParameterError The parameter value is invalid.
 *
 * @apiErrorExample {json} InvalidParameterError-Response:
 *   HTTP/1.1 404 Not Found
 *   {
 *   "message": "Invalid parameter value for surveyName\nValue: \"non-existing-survey\""
 *   }
 */
export class InvalidParameterError extends NotFoundError {
  constructor(paramName: string, paramValue: unknown) {
    super(
      `Invalid parameter value for ${paramName}\nValue: ${JSON.stringify(
        paramValue
      )}`
    );
  }
}

/**
 * @apiDefine InvalidReferenceError
 *
 * @apiError InvalidReferenceError The reference does not exist.
 *
 * @apiErrorExample {json} InvalidReferenceError-Response:
 *    HTTP/1.1 400 Bad Request
 *    {
 *    "message": "Reference to surveyName does not exist.\nReference: \"non-existing-reference\""
 *    }
 */
export class InvalidReferenceError<ReferenceType> extends BadRequest {
  constructor(refName: keyof ReferenceType & string, refValue: unknown) {
    super(
      `Reference ${refName} does not exist.\nReference: ${JSON.stringify(
        refValue
      )}`
    );
  }
}

/**
 * @apiDefine RequestTypeError
 *
 * @apiError RequestTypeError The request body could not be parsed as the given type.
 *
 * @apiErrorExample {json} RequestTypeError-Response:
 *   HTTP/1.1 400 Bad Request
 *   {
 *   "message": "Could not parse request body as Survey\nBody: {\"name\":\"test\",\"questions\": [{\"id\":1,\"text\":\"test\",\"type\":\"text\",\"options\":null,\"surveyName\":null,\"feedbackId\":null}]}"
 *   }
 */
export class RequestTypeError extends BadRequest {
  constructor(type: string, body: unknown) {
    super(
      `Could not parse request body as ${type}\nBody: ${JSON.stringify(body)}`
    );
  }
}

/**
 * @apiDefine IdUrlParseError
 *
 * @apiError IdUrlParseError The url could not be parsed as a valid identifier.
 *
 * @apiErrorExample {json} IdUrlParseError-Response:
 *  HTTP/1.1 400 Bad Request
 *  {
 *  "message": "Could not parse valid identifier for \"survey\" from url: ${host}/surveys/invalid"
 *  }
 */
export class IdUrlParseError extends BadRequest {
  constructor(url: string, referenceType: string) {
    super(
      `Could not parse valid identifier for "${referenceType}" from url: ${url}`
    );
  }
}

/**
 * @apiDefine NotUniqueError
 *
 * @apiError NotUniqueError The value is not unique for the given reference type.
 *
 * @apiErrorExample {json} NotUniqueError-Response:
 * HTTP/1.1 409 Conflict
 * {
 * "message": "The name \"test\" is not unique for survey"
 * }
 */
export class NotUniqueError extends ConflictError {
  constructor(field: string, value: string) {
    super(`The ${field} "${value}" is not unique`);
  }
}
