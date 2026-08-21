import { equal } from "node:assert/strict";
import test from "node:test";
import setData from "./set.ts";

test("setData resolves the runtime before initializing the framework", async () => {
  const cases = [
    ["deno", "deno", "deno test"],
    ["bun", "bun", "bun test --timeout 15000"],
    ["npm", "node", "node --test"],
    ["pnpm", "node", "node --test"],
    ["yarn", "node", "node --test"],
  ] as const;

  for (const [packageManager, rt, testTask] of cases) {
    const data = await setData({
      command: "init",
      dir: `/tmp/fedify-init-${packageManager}`,
      packageManager,
      webFramework: "bare-bones",
      kvStore: "in-memory",
      messageQueue: "in-process",
      dryRun: true,
      allowNonEmpty: false,
      skipInstall: false,
      skipSmokeTest: false,
      testMode: true,
    });

    equal(data.rt, rt);
    equal(data.initializer.tasks?.test, testTask);
  }
});
