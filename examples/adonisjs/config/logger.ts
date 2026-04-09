import env from "#start/env";
import { defineConfig, targets } from "@adonisjs/core/logger";
import app from "@adonisjs/core/services/app";

const loggerConfig = defineConfig({
  default: "app",
  loggers: {
    app: {
      enabled: true,
      name: env.get("APP_NAME", "fedify-adonisjs-example"),
      level: env.get("LOG_LEVEL"),
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty())
          .pushIf(app.inProduction, targets.file({ destination: 1 }))
          .toArray(),
      },
    },
  },
});

export default loggerConfig;

declare module "@adonisjs/core/types" {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
