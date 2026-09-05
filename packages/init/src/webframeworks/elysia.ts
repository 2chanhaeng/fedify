import { PACKAGE_MANAGER } from "../const.ts";
import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import {
  defaultDenoDependencies,
  defaultDevDependencies,
  nodeCompilerOptions,
} from "./const.ts";
import { addTestTask, getInstruction, nodeBunDevToolTasks } from "./utils.ts";

const elysiaDescription: WebFrameworkDescription = {
  label: "Elysia",
  packageManagers: PACKAGE_MANAGER,
  defaultPort: 3000,
  init: async ({ projectName, packageManager: pm, rt, skipSmokeTest }) => ({
    dependencies: DEPENDENCIES[pm],
    devDependencies: {
      ...(pm === "bun" ? { "@types/bun": deps["npm:@types/bun"] } : {
        "@types/node": deps["npm:@types/node@25"],
        typescript: deps["npm:typescript"],
      }),
      ...defaultDevDependencies,
    },
    federationFile: "src/federation.ts",
    loggingFile: "src/logging.ts",
    testFile: "scripts/smoke.test.ts",
    files: {
      "src/index.ts": (await readTemplate(
        `elysia/index/${rt}.ts`,
      )).replace(/\/\* logger \*\//, projectName),
    },
    compilerOptions: rt === "node" ? nodeCompilerOptions : undefined,
    tasks: addTestTask(rt, skipSmokeTest)(TASKS[rt]),
    instruction: getInstruction(pm, 3000),
  }),
};

export default elysiaDescription;

const NODE_DEPENDENCIES = {
  elysia: deps["npm:elysia"],
  "@elysiajs/node": deps["npm:@elysiajs/node"],
  "@fedify/elysia": PACKAGE_VERSION,
} as const;

const DEPENDENCIES: Record<PackageManager, Record<string, string>> = {
  "deno": {
    ...defaultDenoDependencies,
    elysia: `npm:elysia@${deps["npm:elysia"]}`,
    "@fedify/elysia": PACKAGE_VERSION,
  },
  "bun": {
    elysia: deps["npm:elysia"],
    "@fedify/elysia": PACKAGE_VERSION,
  },
  "pnpm": {
    ...NODE_DEPENDENCIES,
    "@sinclair/typebox": deps["npm:@sinclair/typebox"],
    "openapi-types": deps["npm:openapi-types"],
  },
  yarn: NODE_DEPENDENCIES,
  npm: NODE_DEPENDENCIES,
} as Record<PackageManager, Record<string, string>>;

const TASKS = {
  deno: {
    dev:
      "deno serve --allow-read --allow-env --allow-net --watch ./src/index.ts",
    prod: "deno serve --allow-read --allow-env --allow-net ./src/index.ts",
  },
  bun: {
    dev: "bun run --hot ./src/index.ts",
    prod: "bun run ./src/index.ts",
    ...nodeBunDevToolTasks,
  },
  node: {
    dev: "node --env-file=.env --watch src/index.ts",
    build:
      "tsc src/index.ts --outDir dist --target ESNext --module NodeNext --moduleResolution NodeNext --rewriteRelativeImportExtensions --noCheck",
    start: "NODE_ENV=production node --env-file=.env dist/index.js",
    ...nodeBunDevToolTasks,
  },
};

// cspell: ignore typebox
