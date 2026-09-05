import { getDocumentLoader } from "@fedify/fedify";
import { type Actor, isActor, lookupObject } from "@fedify/vocab";
import { spawn, spawnSync } from "node:child_process";
import type { Readable } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";

const DEV_COMMAND: string[] = /* dev command */;
const HANDLE = "john";
const STARTUP_TIMEOUT = 15_000;
const REQUEST_TIMEOUT = 1_000;
const RETRY_DELAY = 500;
const IS_WINDOWS = process.platform === "win32";
const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"] as const;

async function main(): Promise<void> {
  const [command, ...args] = DEV_COMMAND;
  const server = spawn(command, args, {
    env: { ...process.env, ASTRO_DEV_BACKGROUND: "0" },
    stdio: ["ignore", "pipe", "pipe"],
    shell: IS_WINDOWS,
    windowsHide: true,
    detached: !IS_WINDOWS,
  });
  const spawnFailure = new Promise<never>((_, reject) => {
    server.once("error", (error) =>
      reject(new Error(`Failed to start the dev server: ${error.message}`)),
    );
  });

  const exitOnSignal = () => {
    stopServer(server);
    process.exit(1);
  };
  process.once("SIGINT", exitOnSignal);
  process.once("SIGTERM", exitOnSignal);

  let output = "";
  const collectOutput = (stream: Readable | null) => {
    const decoder = new TextDecoder();
    stream?.on("data", (chunk: Buffer) => {
      output += decoder.decode(chunk, { stream: true });
    });
  };
  collectOutput(server.stdout);
  collectOutput(server.stderr);

  try {
    const port = await Promise.race([determinePort(server), spawnFailure]);
    const target = await waitForServer(port);
    console.log(`Server is up at ${new URL(target).origin}.`);
    const actor = await checkActor(target);
    console.log(actor);
    console.log(`Smoke test passed: ${target} resolved to an actor.`);
  } catch (error) {
    console.error("Smoke test failed:", error instanceof Error ? error.message : error);
    if (output.trim() !== "") {
      console.error(`\nDev server output:\n${output}`);
    }
    process.exitCode = 1;
  } finally {
    stopServer(server);
  }
}

function stripEscape(text: string): string {
  return text.replace(new RegExp("\\u001B\\[[0-9;]*[A-Za-z]", "g"), "");
}

function determinePort(server: ReturnType<typeof spawn>): Promise<number> {
  const portPatterns = [
    /listening on.*:(\d+)/i,
    /server.*:(\d+)/i,
    /https?:\/\/localhost:(\d+)/i,
    /https?:\/\/0\.0\.0\.0:(\d+)/i,
    /https?:\/\/127\.0\.0\.1:(\d+)/i,
    /https?:\/\/[^:]+:(\d+)/i,
  ];
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          `Timeout: Could not determine port from server output within ${STARTUP_TIMEOUT}ms.`,
        ),
      );
    }, STARTUP_TIMEOUT);

    const findPort = (text: string) => {
      for (const pattern of portPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const port = Number.parseInt(match[1], 10);
          if (port > 0 && port < 65536) return port;
        }
      }
      return null;
    };

    const scan = (stream: Readable | null) => {
      const decoder = new TextDecoder();
      let text = "";
      stream?.on("data", (chunk: Buffer) => {
        text += decoder.decode(chunk, { stream: true });
        const port = findPort(stripEscape(text));
        if (port != null) {
          clearTimeout(timeout);
          resolve(port);
        }
      });
    };

    scan(server.stdout);
    scan(server.stderr);
    server.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`The dev server exited early with code ${String(code)}.`));
    });
  });
}

async function waitForServer(port: number): Promise<string> {
  const deadline = AbortSignal.timeout(STARTUP_TIMEOUT);
  let lastStatus: number | undefined;
  const targets = LOOPBACK_HOSTS.map(
    (host) => `http://${host}:${port}/users/${HANDLE}`,
  );

  while (!deadline.aborted) {
    const controller = new AbortController();
    const signal = AbortSignal.any([
      deadline,
      controller.signal,
      AbortSignal.timeout(REQUEST_TIMEOUT),
    ]);
    try {
      return await Promise.any(
        targets.map(async (target) => {
          const response = await fetch(target, {
            headers: { Accept: "application/activity+json" },
            signal,
          });
          await response.body?.cancel();
          if (response.ok) return target;
          lastStatus = response.status;
          throw new Error(`Server returned status ${response.status}`);
        }),
      );
    } catch {
      // Server not ready on any loopback address yet
    } finally {
      controller.abort();
    }
    try {
      await delay(RETRY_DELAY, undefined, { signal: deadline });
    } catch {
      break;
    }
  }
  throw new Error(
    `The server did not become ready within ${STARTUP_TIMEOUT}ms.` +
      (lastStatus == null ? "" : `  Last response status: ${lastStatus}.`),
  );
}

async function checkActor(url: string): Promise<Actor> {
  const object = await lookupObject(url, {
    documentLoader: getDocumentLoader({ allowPrivateAddress: true }),
  });
  if (object == null) {
    throw new Error(`Could not resolve an actor at ${url}.`);
  }
  if (!isActor(object)) {
    throw new Error(`Expected an actor at ${url}, but got a non-actor object.`);
  }
  return object;
}

function stopServer(server: ReturnType<typeof spawn>): void {
  if (server.pid == null) return;
  if (IS_WINDOWS) {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  try {
    process.kill(-server.pid, "SIGKILL");
  } catch {
    // Process group already exited.
  }
  try {
    server.kill("SIGKILL");
  } catch {
    // Process already exited.
  }
}

await main();
