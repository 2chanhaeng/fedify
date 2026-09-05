import { pipe } from "@fxts/core";
import { PACKAGE_MANAGER } from "../const.ts";
import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { WebFrameworkDescription } from "../types.ts";
import { replace } from "../utils.ts";
import {
  defaultDenoDependencies,
  defaultDevDependencies,
  nodeCompilerOptions,
} from "./const.ts";
import { addTestTask, getInstruction, nodeBunDevToolTasks } from "./utils.ts";

const honoDescription: WebFrameworkDescription = {
  label: "Hono",
  packageManagers: PACKAGE_MANAGER,
  defaultPort: 8000,
  init: async ({ projectName, packageManager: pm, rt, skipSmokeTest }) => ({
    dependencies: getDependencies(pm),
    devDependencies: {
      ...defaultDevDependencies,
      ...(pm === "bun" ? { "@types/bun": deps["npm:@types/bun"] } : {}),
    },
    federationFile: "src/federation.ts",
    loggingFile: "src/logging.ts",
    testFile: "scripts/smoke.test.ts",
    files: {
      "src/app.ts": pipe(
        await readTemplate("hono/app.ts"),
        replace(/\/\* hono \*\//, pm === "deno" ? "@hono/hono" : "hono"),
        replace(/\/\* logger \*\//, projectName),
      ),
      "src/index.ts": await readTemplate(`hono/index/${rt}.ts`),
    },
    compilerOptions: pm === "deno" ? undefined : {
      ...nodeCompilerOptions,
      "jsx": "react-jsx",
      "jsxImportSource": "hono/jsx",
    },
    tasks: addTestTask(rt, skipSmokeTest)(TASKS[rt]),
    instruction: getInstruction(pm, 8000),
  }),
};

export default honoDescription;

const getDependencies = (pm: string): Record<string, string> =>
  pm === "deno"
    ? {
      ...defaultDenoDependencies,
      "@hono/hono": deps["@hono/hono"],
      "@hongminhee/x-forwarded-fetch": deps["@hongminhee/x-forwarded-fetch"],
      "@fedify/hono": PACKAGE_VERSION,
    }
    : pm === "bun"
    ? {
      hono: deps["npm:hono"],
      "x-forwarded-fetch": deps["npm:x-forwarded-fetch"],
      "@fedify/hono": PACKAGE_VERSION,
    }
    : {
      hono: deps["npm:hono"],
      "@hono/node-server": deps["npm:@hono/node-server"],
      "x-forwarded-fetch": deps["npm:x-forwarded-fetch"],
      "@fedify/hono": PACKAGE_VERSION,
    };

const TASKS = {
  deno: {
    dev: "deno run -A --watch ./src/index.ts",
    prod: "deno run -A ./src/index.ts",
  },
  bun: {
    dev: "bun run --hot ./src/index.ts",
    prod: "bun run ./src/index.ts",
    ...nodeBunDevToolTasks,
  },
  node: {
    dev: "node --env-file=.env --watch ./src/index.ts",
    prod: "node --env-file=.env ./src/index.ts",
    ...nodeBunDevToolTasks,
  },
};
