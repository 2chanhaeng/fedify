import { parse as parsePath, resolve as resolvePath } from "node:path";
import { PACKAGE_MANAGER } from "../const.ts";
import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import { defaultDenoDependencies, defaultDevDependencies } from "./const.ts";
import {
  addTestTask,
  getInstruction,
  getNodeBunDevToolTasks,
} from "./utils.ts";

const nextDescription: WebFrameworkDescription = {
  label: "Next.js",
  packageManagers: PACKAGE_MANAGER,
  defaultPort: 3000,
  init: async (
    { packageManager: pm, rt, skipInstall, skipSmokeTest, testMode, dir },
  ) => ({
    command: getNextInitCommand(pm, skipInstall),
    cleanupFiles: Array.from(cleanupFiles(pm, testMode)),
    cleanupPackageJson: pm === "deno" ? {} : {
      scripts: ["lint"],
      devDependencies: ["eslint", "eslint-config-next"],
    },
    dependencies: {
      "@fedify/next": PACKAGE_VERSION,
      ...(pm === "deno" && defaultDenoDependencies),
    },
    devDependencies: {
      "@types/node": deps["npm:@types/node@20"],
      ...defaultDevDependencies,
    },
    federationFile: "federation/index.ts",
    loggingFile: "logging.ts",
    testFile: "scripts/smoke.test.ts",
    format: { ignorePatterns: [".next/**"] },
    files: await getFiles(testMode, dir),
    tasks: addTestTask(rt, skipSmokeTest)(
      pm === "deno" ? DENO_TASKS : getNodeBunDevToolTasks(pm),
    ),
    instruction: getInstruction(pm, 3000),
  }),
};

export default nextDescription;

/**
 * Returns the shell command array to scaffold a new Next.js project
 * in the current directory using the given package manager.
 */
const getNextInitCommand = (
  pm: PackageManager,
  skipInstall: boolean,
): string[] => [
  ...createNextAppCommand(pm),
  ".",
  "--yes",
  ...(pm === "deno" || skipInstall ? ["--skip-install"] : []),
];

const createNextAppCommand = (pm: PackageManager): string[] =>
  pm === "deno"
    ? ["deno", "run", "-Ar", "npm:create-next-app@latest"]
    : pm === "bun"
    ? ["bun", "create", "next-app"]
    : pm === "npm"
    ? ["npx", "create-next-app"]
    : [pm, "dlx", "create-next-app"];

function* cleanupFiles(pm: PackageManager, testMode: boolean) {
  if (pm !== "deno") yield "eslint.config.mjs";
  if (testMode) yield "next.config.ts";
}

const getFiles = async (testMode: boolean, dir: string) => ({
  "instrumentation.ts": await readTemplate("next/instrumentation.ts"),
  "middleware.ts": await readTemplate("next/middleware.ts"),
  ...(testMode && {
    "next.config.ts": (await readTemplate("next/next.config.ts"))
      .replace(
        /\/\* root \*\//,
        JSON.stringify(parsePath(resolvePath(dir)).root),
      ),
  }),
});

const DENO_TASKS = {
  dev: "deno run -A npm:next dev",
  build: "deno run -A npm:next build",
  start: "deno run -A npm:next start",
};
