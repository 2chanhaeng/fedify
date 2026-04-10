import env from "#start/env";
import { defineConfig } from "@adonisjs/core/app";

export default defineConfig({
  appKey: env.get("APP_KEY", "insecure-app-key-for-development"),
  http: {
    generateRequestId: true,
  },
  logger: {
    default: "app",
    loggers: {
      app: {
        enabled: true,
        name: env.get("APP_NAME", "fedify-adonis"),
        level: env.get("LOG_LEVEL", "info"),
      },
    },
  },
});
