import { PACKAGE_MANAGER } from "../const.ts";
import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { WebFrameworkDescription } from "../types.ts";
import { defaultDenoDependencies, defaultDevDependencies } from "./const.ts";
import { addTestTask, getInstruction, nodeBunDevToolTasks } from "./utils.ts";

const expressDescription: WebFrameworkDescription = {
  label: "Express",
  packageManagers: PACKAGE_MANAGER,
  defaultPort: 8000,
  init: async ({ projectName, packageManager: pm, rt, skipSmokeTest }) => ({
    dependencies: {
      "npm:express": deps["npm:express"],
      "@fedify/express": PACKAGE_VERSION,
      ...(pm === "deno" && defaultDenoDependencies),
    },
    devDependencies: {
      "@types/express": deps["npm:@types/express"],
      ...(pm === "bun" && { "@types/bun": deps["npm:@types/bun"] }),
      ...defaultDevDependencies,
    },
    federationFile: "src/federation.ts",
    loggingFile: "src/logging.ts",
    testFile: "scripts/smoke.test.ts",
    files: {
      "src/app.ts": (await readTemplate("express/app.ts"))
        .replace(/\/\* logger \*\//, projectName),
      "src/index.ts": await readTemplate("express/index.ts"),
    },
    compilerOptions: pm === "deno" ? undefined : {
      "lib": ["ESNext", "DOM"],
      "target": "ESNext",
      "module": "NodeNext",
      "moduleResolution": "NodeNext",
      "allowImportingTsExtensions": true,
      "verbatimModuleSyntax": true,
      "noEmit": true,
      "strict": true,
    },
    tasks: addTestTask(rt, skipSmokeTest)(TASKS[rt]),
    instruction: getInstruction(pm, 8000),
  }),
};

export default expressDescription;

const TASKS = {
  deno: {
    dev:
      "deno run --allow-read --allow-net --allow-env --allow-sys --watch ./src/index.ts",
    prod:
      "deno run --allow-read --allow-net --allow-env --allow-sys ./src/index.ts",
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
