import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import { defaultDevDependencies } from "./const.ts";
import { getInstruction, pmToRt } from "./utils.ts";

const NODE_ONLY_PM = ["pnpm", "bun", "yarn", "npm"] as const;

const adonisDescription: WebFrameworkDescription = {
  label: "AdonisJS",
  packageManagers: NODE_ONLY_PM,
  defaultPort: 3333,
  init: async ({ packageManager: pm }) => ({
    command: getPrecommand(),
    dependencies: {
      "@adonisjs/core": deps["npm:@adonisjs/core"],
      "reflect-metadata": deps["npm:reflect-metadata"],
      "@fedify/adonis": PACKAGE_VERSION,
    },
    devDependencies: {
      ...defaultDevDependencies,
      "@adonisjs/assembler": deps["npm:@adonisjs/assembler"],
      "@adonisjs/tsconfig": deps["npm:@adonisjs/tsconfig"],
      "@types/node": deps["npm:@types/node@22"],
      typescript: deps["npm:typescript"],
      ...(pm === "bun" ? { "@types/bun": deps["npm:@types/bun"] } : {}),
    },
    federationFile: "start/federation.ts",
    loggingFile: "start/logging.ts",
    files: {
      "ace.js": await readTemplate("adonis/ace.js"),
      "adonisrc.ts": await readTemplate("adonis/adonisrc.ts"),
      "bin/server.ts": await readTemplate("adonis/bin/server.ts"),
      "bin/console.ts": await readTemplate("adonis/bin/console.ts"),
      "start/kernel.ts": await readTemplate("adonis/start/kernel.ts"),
      "start/routes.ts": await readTemplate("adonis/start/routes.ts"),
      "start/env.ts": await readTemplate("adonis/start/env.ts"),
      "config/app.ts": await readTemplate("adonis/config/app.ts"),
      "app/exceptions/handler.ts": await readTemplate(
        "adonis/app/exceptions/handler.ts",
      ),
      "app/middleware/container_bindings_middleware.ts": await readTemplate(
        "adonis/app/middleware/container_bindings_middleware.ts",
      ),
      "app/middleware/fedify_middleware.ts": await readTemplate(
        "adonis/app/middleware/fedify_middleware.ts",
      ),
    },
    env: {
      HOST: "0.0.0.0",
      PORT: "3333",
      NODE_ENV: "development",
      LOG_LEVEL: "info",
    },
    tasks: TASKS[pmToRt(pm)],
    instruction: getInstruction(pm, 3333),
  }),
};

export default adonisDescription;

const PACKAGE_JSON_CONTENT = JSON.stringify(
  {
    imports: {
      "#controllers/*": "./app/controllers/*.js",
      "#exceptions/*": "./app/exceptions/*.js",
      "#middleware/*": "./app/middleware/*.js",
      "#start/*": "./start/*.js",
      "#config/*": "./config/*.js",
    },
  },
  null,
  2,
);

const TSCONFIG_CONTENT = JSON.stringify(
  {
    extends: "@adonisjs/tsconfig/tsconfig.app.json",
    compilerOptions: {
      rootDir: "./",
      outDir: "./build",
    },
  },
  null,
  2,
);

function getPrecommand(): string[] {
  return [
    "node",
    "-e",
    `require("fs").writeFileSync("package.json",${JSON.stringify(PACKAGE_JSON_CONTENT)});` +
    `require("fs").writeFileSync("tsconfig.json",${JSON.stringify(TSCONFIG_CONTENT)})`,
  ];
}

const TASKS: Record<"node" | "bun", Record<string, string>> = {
  bun: {
    dev: "node ace serve --hmr",
    build: "node ace build",
    start: "node bin/server.js",
    lint: "eslint .",
  },
  node: {
    dev: "node ace serve --hmr",
    build: "node ace build",
    start: "node bin/server.js",
    lint: "eslint .",
  },
};
