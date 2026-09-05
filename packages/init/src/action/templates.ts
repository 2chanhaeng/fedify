import { concat, entries, join, map, pipe, when } from "@fxts/core";
import { toMerged } from "es-toolkit";
import { getDevCommand, readTemplate } from "../lib.ts";
import type {
  InitCommandData,
  PackageManager,
  WebFramework,
} from "../types.ts";
import { replace } from "../utils.ts";
import { needsDenoDotenv } from "./utils.ts";

/**
 * Loads the federation configuration file content from template.
 * Reads the default federation template and replaces placeholders with actual
 * configuration values.
 *
 * @param param0 - Configuration object containing imports, project name,
 * KV store, message queue, and package manager
 * @returns The complete federation configuration file content as a string
 */
export const loadFederation = async (
  {
    imports,
    projectName,
    kv,
    mq,
    packageManager,
    webFramework,
  }: InitCommandData & { imports: string },
) =>
  pipe(
    await readTemplate(getFederationTemplate(packageManager)),
    replace(/\/\* imports \*\//, imports),
    replace(/\/\* logger \*\//, JSON.stringify(projectName)),
    replace(
      /\/\* kv \*\//,
      convertEnv(kv.object, { packageManager, webFramework }),
    ),
    replace(
      /\/\* queue \*\//,
      convertEnv(mq.object, { packageManager, webFramework }),
    ),
  );

const getFederationTemplate = (packageManager: PackageManager): string =>
  packageManager === "deno"
    ? "defaults/federation.ts"
    : "defaults/federation.oxc.ts";

/**
 * Loads logging configuration file content for the initializer.
 *
 * `loadLogging` accepts the full {@link InitCommandData} so it can read the
 * project name and the framework initializer.  It uses {@link readTemplate} to
 * read `initializer.loggingTemplate` when provided, or falls back to
 * *defaults/logging.ts*, then replaces the project name placeholder.
 *
 * @param param0 - {@link InitCommandData} containing `projectName` and
 *   `initializer`; `initializer.loggingTemplate` selects a framework-specific
 *   logging template when present.
 * @returns The complete logging configuration file content as a string
 */
export const loadLogging = async (
  { projectName, initializer }: InitCommandData,
) =>
  pipe(
    await readTemplate(initializer.loggingTemplate ?? "defaults/logging.ts"),
    replace(/\/\* project name \*\//, JSON.stringify(projectName)),
  );

/**
 * Loads the smoke-test script content for the initializer.
 *
 * The template is chosen by runtime rather than by framework: Deno projects
 * get *defaults/smoke.test/deno.ts*, which registers a `Deno.test()` so that
 * `deno test` reports failures, while Node.js and Bun projects get
 * *defaults/smoke.test/node.ts*, whose `process.exitCode` both runners
 * propagate.  The template spawns the project's own dev server, so it needs
 * the dev command for the chosen package manager baked in at generation time.
 *
 * @param param0 - {@link InitCommandData} containing `packageManager` and `rt`
 * @returns The complete smoke-test script content as a string
 */
export const loadTest = async (
  { packageManager, rt }: InitCommandData,
) =>
  pipe(
    await readTemplate(
      `defaults/smoke.test/${rt === "deno" ? "deno" : "node"}.ts`,
    ),
    replace(
      /\/\* dev command \*\//,
      JSON.stringify(getDevCommand(packageManager).split(" ")).replaceAll(
        ",",
        ", ",
      ),
    ),
  );

/**
 * Generates import statements for KV store and message queue dependencies.
 * Merges imports from both KV and MQ configurations and creates proper
 * ES module import syntax.
 *
 * Destructured parameters:
 * - kv: KV store configuration, including module import mappings
 * - mq: Message queue configuration, including module import mappings
 * - packageManager: Package manager used for environment-specific handling
 * - env: Environment variable setup used to determine loading requirements
 *
 * @param param0 - InitCommandData containing kv, mq, packageManager, and env
 * @returns A multi-line string containing all necessary import statements
 */
export const getImports = (
  { kv, mq, packageManager, webFramework, env }: InitCommandData,
) =>
  pipe(
    toMerged(kv.imports, mq.imports),
    entries,
    map(([module, { "default": defaultImport = "", ...imports }]) => //
    [module, defaultImport, getAlias(imports)]),
    map(([module, defaultImport, namedImports]) =>
      `import ${
        [defaultImport, namedImports.length > 0 ? `{ ${namedImports} }` : ""]
          .filter((x) => x.length > 0)
          .join(", ")
      } from ${JSON.stringify(module)};`
    ),
    when(
      () => needsDenoDotenv({ packageManager, webFramework, env }),
      concat(['import "@std/dotenv/load";']),
    ),
    when(
      () => needsSvelteKitEnv({ webFramework, env }),
      concat([SVELTEKIT_ENV_IMPORT]),
    ),
    join("\n"),
  );

/**
 * SvelteKit never copies *.env* into `process.env`; its Vite plugin exposes the
 * values through the `$env/dynamic/private` module instead, which reads *.env*
 * in `vite dev` and `process.env` in production.
 */
const SVELTEKIT_ENV_IMPORT = 'import { env } from "$env/dynamic/private";';

const needsSvelteKitEnv = (
  { webFramework, env }: Pick<InitCommandData, "webFramework" | "env">,
) => webFramework === "sveltekit" && Object.keys(env).length > 0;

/**
 * Converts import mappings to named import string with aliases.
 * Creates proper ES module named import syntax, using aliases when the import
 * name differs from the local name.
 *
 * @param imports - A record mapping import names to their local aliases
 * @returns A comma-separated string of named imports with aliases where needed
 */
export const getAlias = (imports: Record<string, string>) =>
  Object.entries(imports)
    .map(([name, alias]) => name === alias ? name : `${name} as ${alias}`)
    .sort()
    .join(", ");

const ENV_REG_EXP = /process\.env\.(\w+)/g;

/**
 * Rewrites `process.env.VAR_NAME` references in a template snippet to the
 * environment variable accessor that the target framework and runtime
 * actually populate from *.env*:
 *
 * - Astro: `import.meta.env.VAR_NAME`, which Vite replaces statically for
 *   server code in both `astro dev` and `astro build`.
 * - SvelteKit: `env.VAR_NAME` from `$env/dynamic/private`; the import is
 *   added by {@link getImports}.
 * - Deno (other frameworks): `Deno.env.get("VAR_NAME")`.
 * - Otherwise the `process.env.VAR_NAME` reference is kept as is.
 *
 * @param obj - The object string containing potential environment variable
 * references
 * @param data - The package manager and web framework being used
 * @returns The converted object string with the appropriate environment
 * variable access syntax
 */
export const convertEnv = (
  obj: string,
  { packageManager, webFramework }: Pick<
    InitCommandData,
    "packageManager" | "webFramework"
  >,
) =>
  obj.replaceAll(
    ENV_REG_EXP,
    (_, name) => getEnvAccessor(packageManager, webFramework)(name),
  );

const getEnvAccessor =
  (pm: PackageManager, wf: WebFramework) => (name: string): string =>
    wf === "astro"
      ? `import.meta.env.${name}`
      : wf === "sveltekit"
      ? `env.${name}`
      : pm === "deno"
      ? `Deno.env.get(${JSON.stringify(name)})`
      : `process.env.${name}`;
