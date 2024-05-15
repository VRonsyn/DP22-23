import { auth } from "express-oauth2-jwt-bearer";
import { getEnv } from "../util/dotEnvHandling";

const jwtCheck = auth({
  audience: getEnv().JWT_AUDIENCE,
  issuerBaseURL: getEnv().JWT_ISSUER_BASE_URL,
  tokenSigningAlg: "RS256",
});

export default jwtCheck;
