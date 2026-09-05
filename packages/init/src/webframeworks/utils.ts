import type { Message } from "@optique/core";
import { commandLine, message } from "@optique/core/message";
import { getDevCommand } from "../lib.ts";
import type { PackageManager, Runtime } from "../types.ts";

export const nodeBunDevToolTasks = {
  format: "oxfmt",
  "format:check": "oxfmt --check",
  lint: "oxlint .",
} as const satisfies Record<string, string>;

export const getNodeBunDevToolTasks = (
  pm: PackageManager,
): Record<string, string> => pm === "deno" ? {} : nodeBunDevToolTasks;

/**
 * Returns a function that adds the smoke-test `test` task to an existing task
 * record unless smoke-test generation is skipped.
 */
export const addTestTask = (
  rt: Runtime,
  skipSmokeTest: boolean,
): (tasks: Record<string, string>) => Record<string, string> =>
(tasks) => skipSmokeTest ? tasks : { ...tasks, test: DEFAULT_TEST_TASKS[rt] };

const DEFAULT_TEST_TASKS: Record<Runtime, string> = {
  deno: `deno test --allow-run --allow-env --allow-net`,
  bun: `bun test --timeout 15000`,
  node: `node --test`,
};

/**
 * Generates the post-initialization instruction message that shows
 * the user how to start the dev server and look up an actor.
 *
 * @param packageManager - The chosen package manager
 * @param port - The default port for the dev server
 * @returns A formatted `Message` with startup instructions
 */
export const getInstruction: (
  packageManager: PackageManager,
  port: number,
) => Message = (pm, port) =>
  message`
To start the server, run the following command:

  ${commandLine(getDevCommand(pm))}

Then, try to look up an actor from your server:

  ${commandLine(`fedify lookup http://localhost:${port}/users/john`)}

`;

/**
 * Converts a package manager to its corresponding runtime.
 * @param pm - The package manager (deno, bun, npm, yarn, pnpm)
 * @returns The runtime name (deno, bun, or node)
 */
export const pmToRt = (pm: PackageManager): "deno" | "bun" | "node" =>
  (pm !== "deno" && pm !== "bun") ? "node" : pm;
