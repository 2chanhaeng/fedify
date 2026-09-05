import $ from "@david/dax";
import {
  concat,
  filter,
  isEmpty,
  map,
  pipe,
  tap,
  toArray,
  uniq,
  unless,
} from "@fxts/core";
import { commandLine, optionName } from "@optique/core";
import { createConnection } from "node:net";
import process from "node:process";
import type { TestInitCommand } from "../command.ts";
import { DB_TO_CHECK } from "../const.ts";
import DB_INFO from "../json/db-to-check.json" with { type: "json" };
import { printErrorMessage, printMessage } from "../utils.ts";
import type { DbToCheckType, DefineAllOptions } from "./types.ts";

/**
 * Checks if a given port is open by attempting a raw TCP connection to
 * localhost at that port. This works reliably for non-HTTP services like
 * Redis, PostgreSQL, or AMQP.
 * @param port The port number to check.
 * @param timeout The timeout in milliseconds. Defaults to 3000.
 * @returns A promise that resolves to true if the port is open, else false.
 */
function isPortOpen(port: number, timeout = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "localhost" });
    socket.setTimeout(timeout);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const getRequiredDbs = <T extends TestInitCommand>(
  { kvStore, messageQueue }: DefineAllOptions<T>,
): DbToCheckType[] =>
  pipe(
    kvStore,
    concat(messageQueue),
    uniq,
    filter((db): db is DbToCheckType =>
      DB_TO_CHECK.includes(db as DbToCheckType)
    ),
    toArray,
  );

/**
 * Environment variables that indicate a devcontainer (VS Code Remote
 * Containers, GitHub Codespaces, or the devcontainer CLI).  The
 * `test:init:db:*` mise tasks are only supported in the repository's
 * devcontainer (*.devcontainer/devcontainer.json*).
 */
const DEVCONTAINER_ENV_VARS = [
  "REMOTE_CONTAINERS",
  "CODESPACES",
  "DEVCONTAINER",
];

const isDevcontainer = (): boolean =>
  DEVCONTAINER_ENV_VARS.some((name) => {
    const value = process.env[name];
    return value != null && value !== "" && value !== "false";
  });

/**
 * Explains how to make a database available for the tests.  Inside the
 * devcontainer the `test:init:db:*` mise tasks can install and start it;
 * elsewhere the same tasks are suggested conditionally, together with the
 * upstream installation guide.
 */
function printDbHint(db: DbToCheckType): void {
  const info = DB_INFO[db];
  const flag = optionName(`--${db}`);
  const install = commandLine(`mise run test:init:db:install -- ${flag}`);
  const start = commandLine(
    `mise run test:init:db:start -- ${flag} --background`,
  );
  const withDb = commandLine("mise run test:init -- --with-db");
  if (isDevcontainer()) {
    printMessage`  Run the following tasks to install and start \
${info.name}: ${install} and ${start} \
(or pass --with-db to the test task: ${withDb}).`;
  } else {
    printMessage`  If you are in the devcontainer environment \
(.devcontainer/devcontainer.json), run the following tasks: ${install} and \
${start} (or ${withDb}). Otherwise install ${info.name} manually: \
${info.documentation}`;
  }
}

export async function checkRequiredDbs<T extends TestInitCommand>(
  options: DefineAllOptions<T>,
): Promise<void> {
  const dbs = Array.from(getRequiredDbs(options));
  if (dbs.length === 0) return;

  printMessage`Checking required databases...`;

  for (const db of dbs) {
    const info = DB_INFO[db];
    const port = String(info.defaultPort);
    const running = await isPortOpen(info.defaultPort);
    if (running) {
      printMessage`  ${info.name} is running on port ${port}.`;
    } else {
      printErrorMessage`${info.name} is not running on port ${port}. \
Tests requiring ${info.name} may fail.`;
      printDbHint(db);
    }
  }
}

/**
 * The `--<db>` flags of the `test:init:db:*` mise tasks for the databases
 * that the selected options require.
 */
const getRequiredDbFlags = <T extends TestInitCommand>(
  options: DefineAllOptions<T>,
): string[] =>
  pipe(
    getRequiredDbs(options),
    map((db) => `--${db}`),
    toArray,
  );

/**
 * Runs a `test:init:db:*` mise task quietly.  Its output (including the
 * `[test-init-db]` notices) is captured and only replayed to stderr when the
 * task fails, so a successful run keeps the test log short.
 */
async function runDbTask(task: string, args: string[]): Promise<void> {
  const result = await $`mise run ${task} -- ${args}`
    .captureCombined()
    .noThrow();
  if (result.code === 0) return;
  process.stderr.write(result.combined);
  throw new Error(`mise run ${task} failed with exit code ${result.code}.`);
}

const executeIfRequiredDb =
  <Result>(action: (dbFlags: string[]) => Result) =>
  <T extends TestInitCommand>(
    options: DefineAllOptions<T>,
  ) =>
    pipe(
      options,
      getRequiredDbFlags,
      unless(isEmpty<string[]>, action),
    );

/**
 * Starts the required databases through the `test:init:db:start` mise task
 * when `--with-db` is given.  The task is only supported in the repository's
 * devcontainer; see *scripts/test-init-db/*.
 */
export const startRequiredDbs = executeIfRequiredDb((flags) =>
  pipe(
    flags,
    tap(() => printMessage`Starting required databases...`),
    tap((flags) => runDbTask("test:init:db:start", [...flags, "--background"])),
  )
);

/**
 * Stops the databases started by {@link startRequiredDbs} through the
 * `test:init:db:stop` mise task when `--with-db` is given.
 */
export const stopRequiredDbs = executeIfRequiredDb((flags) =>
  pipe(
    flags,
    tap(() => printMessage`Stopping required databases...`),
    tap((flags) => runDbTask("test:init:db:stop", flags)),
  )
);

export const isWithDb = <T extends TestInitCommand>(
  options: DefineAllOptions<T>,
): boolean => options.withDb;
