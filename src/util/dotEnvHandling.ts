import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

dotenvConfig();

const envSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  HOST: z.string(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  PORT: z.string(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL: z.string(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  JWT_AUDIENCE: z.string(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  JWT_ISSUER_BASE_URL: z.string(),
});

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (err: unknown) {
  const error = err as Error;
  throw new Error(`Invalid environment variables!\n${error.message}`);
}

export function getEnv(): z.infer<typeof envSchema> {
  return env;
}
