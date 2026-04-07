import { configure, getConsoleSink } from "@logtape/logtape";
import { defineNitroPlugin } from "nitropack/runtime";
import { AsyncLocalStorage } from "node:async_hooks";

export default defineNitroPlugin(async () => {
  await configure({
    contextLocalStorage: new AsyncLocalStorage(),
    sinks: {
      console: getConsoleSink(),
    },
    filters: {},
    loggers: [
      {
        category: "fedify",
        lowestLevel: "info",
        sinks: ["console"],
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
    ],
  });
});
