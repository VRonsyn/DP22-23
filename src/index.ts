import { app } from "./application";
import { logger } from "./util/logger";
import { getEnv } from "./util/dotEnvHandling";

app.listen(getEnv().PORT, () => {
  logger.info(`🚀 as-planned-backend listening on port ${getEnv().PORT} 🚀`);
  logger.info(
    `Navigate to http://localhost:${getEnv().PORT} or http://127.0.0.1:${
      getEnv().PORT
    } to access the api`
  );
});
