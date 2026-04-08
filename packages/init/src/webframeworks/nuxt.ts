import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import { getInstruction } from "./utils.ts";

const PACKAGE_MANAGERS = ["pnpm", "bun", "yarn", "npm"] as const;

const nuxtDescription: WebFrameworkDescription = {
  label: "Nuxt",
  packageManagers: PACKAGE_MANAGERS,
  defaultPort: 3000,
  init: async ({ packageManager: pm, testMode }) => ({
    command: getNuxtInitCommand(pm),
    dependencies: {
      "@fedify/nuxt": PACKAGE_VERSION,
      "nuxt": deps["npm:nuxt"],
    },
    federationFile: "server/federation.ts",
    loggingFile: "server/logging.ts",
    env: testMode ? { HOST: "127.0.0.1" } : {} as Record<string, string>,
    files: {
      "nuxt.config.ts": await readTemplate("nuxt/nuxt.config.ts"),
    },
    tasks: {
      dev: "nuxt dev --port 3000 --host 0.0.0.0",
      build: "nuxt build",
      start: "nuxt preview --port 3000 --host 0.0.0.0",
      postinstall: "nuxt prepare",
    },
    instruction: getInstruction(pm, 3000),
  }),
};

export default nuxtDescription;

function getNuxtInitCommand(pm: PackageManager): string[] {
  const create = pm === "bun"
    ? ["bunx", "nuxi@latest"]
    : pm === "npm"
    ? ["npx", "nuxi@latest"]
    : [pm, "dlx", "nuxi@latest"];
  return [
    ...create,
    "init",
    ".",
    "--yes",
    "--packageManager",
    pm,
    "--gitInit",
    "false",
    "--install",
    "false",
    "&&",
    "rm",
    "-f",
    "nuxt.config.ts",
  ];
}
