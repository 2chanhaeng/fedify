import { PACKAGE_MANAGER } from "../const.ts";
import deps from "../json/deps.json" with { type: "json" };
import { PACKAGE_VERSION, readTemplate } from "../lib.ts";
import type { PackageManager, WebFrameworkDescription } from "../types.ts";
import { defaultDenoDependencies } from "./const.ts";
import { addTestTask, getInstruction } from "./utils.ts";

const astroDescription: WebFrameworkDescription = {
  label: "Astro",
  packageManagers: PACKAGE_MANAGER,
  defaultPort: 4321,
  init: async ({ packageManager: pm, skipSmokeTest, rt }) => ({
    command: Array.from(getAstroInitCommand(pm)),
    dependencies: getDependencies(pm),
    devDependencies: getDevDependencies(pm),
    federationFile: "src/federation.ts",
    loggingFile: "src/logging.ts",
    testFile: "scripts/smoke.test.ts",
    format: pm === "deno" ? undefined : { tool: "prettier" },
    files: {
      "astro.config.ts": await readTemplate(
        `astro/astro.config.${rt}.ts`,
      ),
      "src/middleware.ts": await readTemplate("astro/src/middleware.ts"),
    },
    tasks: addTestTask(rt, skipSmokeTest)(TASKS[rt]),
    instruction: getInstruction(pm, 4321),
  }),
};

export default astroDescription;

/**
 * Returns the shell command array to scaffold a new Astro project
 * in the current directory using the given package manager.
 * Also removes the default `astro.config.mjs` so it can be replaced
 * by a template.
 */
function* getAstroInitCommand(
  pm: PackageManager,
): Generator<string> {
  yield* createAstroAppCommand(pm);
  yield* [
    `astro@${deps["npm:create-astro"]}`,
    ".",
    "--",
    "--no-git",
    "--skip-houston",
    "-y",
    "--ref",
    `astro@${deps["npm:astro"].replace(/^\D+/, "")}`,
  ];
  if (pm !== "deno") yield "--no-install";
  yield* ["&&", "rm", "astro.config.mjs"];
  if (pm === "deno") yield "package.json";
}

const createAstroAppCommand = (pm: PackageManager): string[] =>
  pm === "deno" ? ["deno", "init", "-y", "--npm"] : [pm, "create"];

const getDependencies: (pm: PackageManager) => Record<string, string> = (
  pm: PackageManager,
): Record<string, string> =>
  pm === "deno"
    ? {
      ...defaultDenoDependencies,
      "@fedify/fedify": `npm:@fedify/fedify@${PACKAGE_VERSION}`,
      "@fedify/vocab": `npm:@fedify/vocab@${PACKAGE_VERSION}`,
      "@logtape/logtape": `npm:@logtape/logtape@${deps["@logtape/logtape"]}`,
      // Astro loads integrations and middleware through Vite.  Vite resolves
      // bare imports from node_modules rather than Deno's JSR import map, so
      // keep Vite-loaded dependencies on npm even though @fedify/astro is also
      // published on JSR.
      astro: `npm:astro@${deps["npm:astro"]}`,
      "@deno/astro-adapter": `npm:@deno/astro-adapter@${
        deps["npm:@deno/astro-adapter"]
      }`,
      "@fedify/astro": `npm:@fedify/astro@${PACKAGE_VERSION}`,
    }
    : pm === "bun"
    ? {
      "@astrojs/node": deps["npm:@astrojs/node"],
      "@fedify/astro": PACKAGE_VERSION,
      astro: deps["npm:astro"],
    }
    : {
      "@astrojs/node": deps["npm:@astrojs/node"],
      "@fedify/astro": PACKAGE_VERSION,
      astro: deps["npm:astro"],
    };

const getDevDependencies: (pm: PackageManager) => Record<string, string> = (
  pm: PackageManager,
): Record<string, string> =>
  pm === "deno" ? {} : ({
    "@fedify/lint": PACKAGE_VERSION,
    "oxlint": deps["npm:oxlint"],
    "prettier": deps["npm:prettier"],
    "prettier-plugin-astro": deps["npm:prettier-plugin-astro"],
    typescript: deps["npm:typescript"],
    "@types/node": deps["npm:@types/node@22"],
  });

const astroNodeBunDevToolTasks = {
  format: "prettier --plugin prettier-plugin-astro --write .",
  "format:check": "prettier --plugin prettier-plugin-astro --check .",
  lint: "oxlint .",
} as const;

const astroDenoCommand = `deno run -A npm:astro@${deps["npm:astro"]}`;

const TASKS = {
  "deno": {
    dev: `${astroDenoCommand} dev`,
    build: `${astroDenoCommand} build`,
    preview: `${astroDenoCommand} preview`,
  },
  "bun": {
    dev: "bunx --bun astro dev",
    build: "bunx --bun astro build",
    preview: "bun ./dist/server/entry.mjs",
    ...astroNodeBunDevToolTasks,
  },
  "node": {
    dev: "astro dev",
    build: "astro build",
    preview: "astro preview",
    ...astroNodeBunDevToolTasks,
  },
};
