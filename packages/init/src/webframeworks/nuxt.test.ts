import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import nuxtDescription from "./nuxt.ts";

test("Nuxt uses deno run to execute nuxi", async () => {
  const initializer = await nuxtDescription.init({
    projectName: "test-app",
    dir: ".",
    command: "init",
    packageManager: "deno",
    rt: "deno",
    kvStore: "in-memory",
    messageQueue: "in-process",
    webFramework: "nuxt",
    testMode: false,
    dryRun: true,
    allowNonEmpty: false,
    skipInstall: false,
    skipSmokeTest: false,
  });

  deepStrictEqual(initializer.command?.slice(0, 4), [
    "deno",
    "run",
    "-A",
    "npm:nuxi@latest",
  ]);
});
