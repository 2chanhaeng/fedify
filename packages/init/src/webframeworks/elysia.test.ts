import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import elysiaDescription from "./elysia.ts";

test("Elysia Node.js template builds TypeScript for production", async () => {
  for (const packageManager of ["npm", "pnpm"] as const) {
    const initializer = await elysiaDescription.init({
      projectName: "test-app",
      dir: ".",
      command: "init",
      packageManager,
      rt: "node",
      kvStore: "in-memory",
      messageQueue: "in-process",
      webFramework: "elysia",
      testMode: false,
      dryRun: true,
      allowNonEmpty: false,
      skipInstall: false,
      skipSmokeTest: false,
    });

    strictEqual(
      initializer.tasks?.build,
      "tsc src/index.ts --outDir dist --target ESNext --module NodeNext --moduleResolution NodeNext --rewriteRelativeImportExtensions --noCheck",
    );
  }
});
