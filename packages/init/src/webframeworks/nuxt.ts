import { PACKAGE_MANAGER } from "../const.ts";
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import { defaultDenoDependencies, defaultDevDependencies } from "./const.ts";
import { getInstruction } from "./utils.ts";

const nuxtDescription: WebFrameworkDescription = {
  label: "Nuxt",
  packageManagers: PACKAGE_MANAGER.filter((pm) => pm !== "deno"),
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
      "server/middleware/federation.ts": await readTemplate(
        "nuxt/server/middleware/federation.ts",
      ),
      "server/error.ts": await readTemplate("nuxt/server/error.ts"),
      "nuxt.config.ts": await readTemplate("nuxt/nuxt.config.ts"),
      ...(pm !== "deno" && {
        "eslint.config.ts": await readTemplate("defaults/eslint.config.ts"),
      }),
    },
    tasks: pm !== "deno"
      ? { "lint": "eslint ." }
      : {} as Record<string, string>,
    instruction: getInstruction(pm, 3000),
  }),
};

export default nuxtDescription;

/**
 * Returns the shell command array to scaffold a new Nuxt project
 * in the current directory using the given package manager.
 * Also removes the default `nuxt.config.ts` so it can be replaced
 * by a template.
 */
const getNuxtInitCommand = (
  pm: PackageManager,
): string[] => [
  ...createNuxtAppCommand(pm),
  "nuxi@latest",
  "init",
  ".",
  "--no-install",
  "--no-gitInit",
  "&&",
  "rm",
  "nuxt.config.ts",
];

const createNuxtAppCommand = (pm: PackageManager): string[] =>
  pm === "bun"
    ? ["bunx"]
    : pm === "npm"
    ? ["npx"]
    : [pm, "dlx"];
