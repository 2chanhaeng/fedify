import { PACKAGE_MANAGER } from "../const.ts";
import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import { defaultDevDependencies } from "./const.ts";
import { getInstruction, pmToRt } from "./utils.ts";

const nuxtDescription: WebFrameworkDescription = {
  label: "Nuxt",
  packageManagers: PACKAGE_MANAGER.filter((pm) => pm !== "deno"),
  defaultPort: 3000,
  init: async ({ packageManager: pm, testMode }) => ({
    command: getNuxtInitCommand(pm),
    dependencies: {
      "nuxt": deps["npm:nuxt"],
      "@fedify/nuxt": PACKAGE_VERSION,
      ...(pmToRt(pm) === "node" && {
        "@dotenvx/dotenvx": deps["npm:@dotenvx/dotenvx"],
      }),
    },
    devDependencies: defaultDevDependencies,
    federationFile: "server/federation.ts",
    loggingFile: "server/logging.ts",
    env: testMode ? { HOST: "127.0.0.1" } : {} as Record<string, string>,
    files: {
      "server/middleware/federation.ts": await readTemplate(
        "nuxt/server/middleware/federation.ts",
      ),
      "server/error.ts": await readTemplate("nuxt/server/error.ts"),
      "nuxt.config.ts": await readTemplate("nuxt/nuxt.config.ts"),
      "app.vue": await readTemplate("nuxt/app.vue"),
      ...(pm !== "deno" && {
        "eslint.config.ts": await readTemplate("defaults/eslint.config.ts"),
      }),
    },
    tasks: TASKS[pmToRt(pm)],
    instruction: getInstruction(pm, 3000),
  }),
};

export default nuxtDescription;

/**
 * Returns the shell command array to scaffold a new Nuxt project
 * in the current directory using the given package manager.
 * Also removes the default `nuxt.config.ts` so it can be replaced
 * by our template.
 */
const getNuxtInitCommand = (pm: PackageManager): string[] => [
  ...createNuxiCommand(pm),
  "nuxi@3",
  "init",
  ".",
  "--no-install",
  "&&",
  "rm",
  "-f",
  "nuxt.config.ts",
  "app.vue",
];

const createNuxiCommand = (pm: PackageManager): string[] =>
  pm === "bun"
    ? ["bunx"]
    : pm === "npm" || pm === "deno"
    ? ["npx"]
    : [pm, "dlx"];

const TASKS = {
  deno: {
    dev: "nuxt dev",
    build: "nuxt build",
    start: "nuxt start",
  },
  bun: {
    dev: "nuxt dev",
    build: "nuxt build",
    start: "nuxt start",
    lint: "eslint .",
  },
  node: {
    dev: "nuxt dev",
    build: "nuxt build",
    start: "dotenvx run -- nuxt start",
    lint: "eslint .",
  },
};
