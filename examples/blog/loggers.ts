import { getFileSink } from "@logtape/file";
import { configure, getConsoleSink, type LogLevel } from "@logtape/logtape";
import { AsyncLocalStorage } from "node:async_hooks";

await configure({
  contextLocalStorage: new AsyncLocalStorage(),
  sinks: {
    console: getConsoleSink(),
    file: Deno.env.get("DENO_DEPLOYMENT_ID") == null
      ? getFileSink("log.jsonl", {
        formatter(log) {
          return JSON.stringify(log) + "\n";
        },
      })
      : (_) => {},
  },
  filters: {},
  loggers: [
    {
      category: "fedify",
      lowestLevel: (Deno.env.get("FEDIFY_LOG") as LogLevel | undefined) ??
        "debug",
      sinks: ["console", "file"],
    },
    {
      category: "blog",
      lowestLevel: (Deno.env.get("BLOG_LOG") as LogLevel | undefined) ??
        "debug",
      sinks: ["console", "file"],
    },
    {
      category: ["logtape", "meta"],
      lowestLevel: "warning",
      sinks: ["console", "file"],
    },
  ],
});
