import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import { defaultDevDependencies } from "./const.ts";
import { getInstruction } from "./utils.ts";

const nuxtDescription: WebFrameworkDescription = {
  label: "Nuxt",
  // Nuxt's CLI (`nuxi`) targets Node.js, Bun, and the major Node.js
  // package managers.  Deno is not officially supported as a development
  // runtime for Nuxt, so it is excluded here.
  packageManagers: ["pnpm", "bun", "yarn", "npm"],
  defaultPort: 3000,
  init: async ({ packageManager: pm, testMode }) => ({
    command: getNuxtInitCommand(pm),
    dependencies: {
      "@fedify/nuxt": PACKAGE_VERSION,
    },
    devDependencies: defaultDevDependencies,
    federationFile: "server/federation.ts",
    loggingFile: "server/logging.ts",
    env: testMode ? { HOST: "127.0.0.1" } : {} as Record<string, string>,
    files: {
      "nuxt.config.ts": await readTemplate("nuxt/nuxt.config.ts"),
      "server/middleware/federation.ts": await readTemplate(
        "nuxt/server/middleware/federation.ts",
      ),
      "server/error.ts": await readTemplate("nuxt/server/error.ts"),
      "eslint.config.ts": await readTemplate("defaults/eslint.config.ts"),
    },
    tasks: {
      lint: "eslint .",
    },
    instruction: getInstruction(pm, 3000),
  }),
};

export default nuxtDescription;

/**
 * Returns the shell command array to scaffold a new Nuxt project in the
 * current directory using the given package manager.  Also removes the
 * default `nuxt.config.ts` so it can be replaced by the Fedify template.
 *
 * `--modules ""` is passed to suppress the interactive “browse and
 * install modules” prompt that `nuxi init` shows otherwise.
 */
const getNuxtInitCommand = (
  pm: PackageManager,
): string[] => [
  ...createNuxtAppCommand(pm),
  "nuxi@latest",
  "init",
  "--force",
  "--template",
  "minimal",
  "--packageManager",
  pm,
  "--no-install",
  "--modules",
  "",
  ".",
  "&&",
  "rm",
  "nuxt.config.ts", // Removed so the Fedify template can replace it.
];

const createNuxtAppCommand = (pm: PackageManager): string[] =>
  pm === "bun" ? ["bunx"] : pm === "npm" ? ["npx"] : [pm, "dlx"];
