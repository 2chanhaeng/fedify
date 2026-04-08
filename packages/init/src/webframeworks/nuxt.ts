import { PACKAGE_MANAGER } from "../const.ts";
import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import { defaultDenoDependencies, defaultDevDependencies } from "./const.ts";
import { getInstruction, pmToRt } from "./utils.ts";

const nuxtDescription: WebFrameworkDescription = {
  label: "Nuxt",
  packageManagers: PACKAGE_MANAGER,
  defaultPort: 3000,
  init: async ({ packageManager: pm }) => ({
    command: Array.from(getNuxtInitCommand(pm)),
    dependencies: pm === "deno"
      ? {
        ...defaultDenoDependencies,
        "@fedify/nuxt": PACKAGE_VERSION,
        "nuxt": deps["npm:nuxt" as keyof typeof deps] || "^3.12.0",
        "vue": deps["npm:vue" as keyof typeof deps] || "^3.4.0",
      }
      : {
        "@fedify/nuxt": PACKAGE_VERSION,
        "nuxt": deps["npm:nuxt" as keyof typeof deps] || "^3.12.0",
        "vue": deps["npm:vue" as keyof typeof deps] || "^3.4.0",
        ...(pm !== "bun" &&
          {
            "@dotenvx/dotenvx":
              deps["npm:@dotenvx/dotenvx" as keyof typeof deps] || "^1.0.0",
          }),
      },
    devDependencies: {
      ...defaultDevDependencies,
      ...(pm !== "deno"
        ? {
          typescript: deps["npm:typescript"],
          "@types/node": deps["npm:@types/node@22"],
        }
        : {}),
    },
    federationFile: "server/utils/federation.ts",
    loggingFile: "server/utils/logging.ts",
    files: {
      "server/middleware/fedify.ts": await readTemplate(
        "nuxt/server/middleware/fedify.ts",
      ),
      "nuxt.config.ts": await readTemplate(
        `nuxt/nuxt.config.${pm === "deno" ? "deno" : "node"}.ts`,
      ),
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
 */
function* getNuxtInitCommand(pm: PackageManager): Generator<string> {
  if (pm === "deno") {
    yield "deno";
    yield "run";
    yield "-A";
    yield "npm:nuxi@latest";
  } else if (pm === "bun") {
    yield "bunx";
    yield "nuxi@latest";
  } else if (pm === "pnpm") {
    yield "pnpm";
    yield "dlx";
    yield "nuxi@latest";
  } else if (pm === "yarn") {
    yield "yarn";
    yield "dlx";
    yield "nuxi@latest";
  } else {
    yield "npx";
    yield "nuxi@latest";
  }
  yield "init";
  yield ".";
  yield "--force";
  if (pm !== "deno") {
    yield "--no-install";
    yield "--packageManager";
    yield pm === "yarn"
      ? "yarn"
      : (pm === "pnpm" ? "pnpm" : (pm === "bun" ? "bun" : "npm"));
  }
}

const TASKS = {
  "deno": {
    dev: "deno run -A npm:nuxi dev",
    build: "deno run -A npm:nuxi build",
    preview: "deno run -A npm:nuxi preview",
  },
  "bun": {
    dev: "bunx nuxi dev",
    build: "bunx nuxi build",
    preview: "bunx nuxi preview",
    lint: "eslint .",
  },
  "node": {
    dev: "dotenvx run -- nuxi dev",
    build: "dotenvx run -- nuxi build",
    preview: "dotenvx run -- nuxi preview",
    lint: "eslint .",
  },
};
