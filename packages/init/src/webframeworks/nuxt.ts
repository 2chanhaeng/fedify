import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import { defaultDevDependencies } from "./const.ts";
import { getInstruction } from "./utils.ts";

const nuxtDescription: WebFrameworkDescription = {
  label: "Nuxt",
  packageManagers: ["pnpm", "bun", "yarn", "npm"],
  defaultPort: 3000,
  init: async ({ packageManager: pm, testMode }) => ({
    command: getNuxtInitCommand(pm),
    dependencies: {
      "@fedify/nuxt": PACKAGE_VERSION,
      nuxt: deps["npm:nuxt"],
    },
    devDependencies: {
      ...defaultDevDependencies,
      typescript: deps["npm:typescript"],
      "@types/node": deps["npm:@types/node@22"],
    },
    federationFile: "server/federation.ts",
    loggingFile: "server/logging.ts",
    env: testMode ? { HOST: "127.0.0.1" } : {} as Record<string, string>,
    files: {
      "server/middleware/federation.ts": await readTemplate(
        "nuxt/server/middleware/federation.ts",
      ),
      "server/error.ts": await readTemplate("nuxt/server/error.ts"),
      "nuxt.config.ts": await readTemplate("nuxt/nuxt.config.ts"),
      "eslint.config.ts": await readTemplate("defaults/eslint.config.ts"),
    },
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "Bundler",
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
    tasks: {
      lint: "eslint .",
    },
    instruction: getInstruction(pm, 3000),
  }),
};

export default nuxtDescription;

/**
 * Returns the shell command array to scaffold a new Nuxt project
 * in the current directory using the given package manager.
 * Uses `giget` to download the Nuxt starter template non-interactively,
 * then removes the default `nuxt.config.ts` so it can be replaced by
 * a template.
 */
const getNuxtInitCommand = (
  pm: PackageManager,
): string[] => [
  ...gigetCommand(pm),
  "giget@latest",
  "gh:nuxt/starter#v4",
  ".",
  "&&",
  "rm",
  "nuxt.config.ts",
];

const gigetCommand = (pm: PackageManager): string[] =>
  pm === "bun" ? ["bunx"] : pm === "npm" ? ["npx"] : [pm, "dlx"];
