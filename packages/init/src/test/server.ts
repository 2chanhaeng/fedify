import { spawn } from "node:child_process";
import { createWriteStream, type WriteStream } from "node:fs";
import { join as joinPath } from "node:path";
import process from "node:process";
import { Readable } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";
import { printErrorMessage } from "../utils.ts";
import { ensurePortReleased, killProcessOnPort } from "./port.ts";

export const STARTUP_TIMEOUT = 10_000;
const REQUEST_TIMEOUT = 1_000;
const RETRY_DELAY = 500;

/**
 * Wait for the server to be ready by checking if it responds to requests.
 */
export async function waitForServer(
  url: string,
  timeout: number = STARTUP_TIMEOUT,
): Promise<boolean> {
  const deadline = AbortSignal.timeout(timeout);
  const urls = getLoopbackUrls(url);

  while (!deadline.aborted) {
    const controller = new AbortController();
    const signal = AbortSignal.any([
      deadline,
      controller.signal,
      AbortSignal.timeout(REQUEST_TIMEOUT),
    ]);
    try {
      await Promise.any(
        urls.map(async (target) => {
          const response = await fetch(target, {
            signal,
          });
          const ok = response.ok;
          await response.body?.cancel();
          if (!ok) throw new Error(`Server returned status ${response.status}`);
        }),
      );
      return true;
    } catch {
      // Server not ready on any loopback address yet
    } finally {
      controller.abort();
    }

    try {
      await delay(RETRY_DELAY, undefined, { signal: deadline });
    } catch {
      return false;
    }
  }

  return false;
}

export async function serverClosure<T>(
  dir: string,
  cmd: string,
  defaultPort: number,
  callback: (port: number) => Promise<T>,
  releasePort?: () => Promise<void>,
): Promise<Awaited<T>> {
  // Release the reserved socket right before spawning so the child can bind
  await releasePort?.();

  const devCommand = cmd.split(" ");
  const child = spawn(devCommand[0], devCommand.slice(1), {
    cwd: dir,
    env: {
      ...process.env,
      ASTRO_DEV_BACKGROUND: "0",
      PORT: String(defaultPort),
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true, // creates a new process group so we can kill the tree
  });

  // Prevent unhandled exception when the process is killed
  child.on("error", () => {});

  // Convert Node.js readable streams to Web ReadableStreams for tee()
  const stdoutWeb = Readable.toWeb(child.stdout!) as ReadableStream<Uint8Array>;
  const stderrWeb = Readable.toWeb(child.stderr!) as ReadableStream<Uint8Array>;

  const [stdoutForFile, stdoutForPort] = stdoutWeb.tee();
  const [stderrForFile, stderrForPort] = stderrWeb.tee();

  // Shared signal to cancel all background stream readers on cleanup
  const cleanup = new AbortController();

  // Append stdout and stderr to files
  const outFile = createWriteStream(joinPath(dir, "out.txt"), { flags: "a" });
  const errFile = createWriteStream(joinPath(dir, "err.txt"), { flags: "a" });
  const pipeOutDone = pipeStream(stdoutForFile, outFile, cleanup.signal);
  const pipeErrDone = pipeStream(stderrForFile, errFile, cleanup.signal);

  let port = defaultPort;
  try {
    port = await determinePort(
      stdoutForPort,
      stderrForPort,
      cleanup.signal,
    ).catch((err) => {
      printErrorMessage`Failed to determine server port: ${err.message}`;
      printErrorMessage`Use default port ${String(defaultPort)} for lookup.`;
      return defaultPort;
    });
    return await callback(port);
  } finally {
    // Kill the entire process group
    try {
      if (child.pid != null) {
        process.kill(-child.pid, "SIGKILL");
      }
    } catch {
      // Process group already exited
    }

    // Also kill the child directly in case it wasn't in the group
    try {
      child.kill("SIGKILL");
    } catch {
      // Process already exited
    }

    // Cancel all background stream readers
    cleanup.abort();
    await Promise.all([pipeOutDone, pipeErrDone]).catch(() => {});

    // Kill any remaining child processes still listening on the port
    await killProcessOnPort(port);

    // Close file streams
    outFile.end();
    errFile.end();

    // Ensure port is released before next test
    await ensurePortReleased(port);
  }
}

function getLoopbackUrls(url: string): string[] {
  const parsed = new URL(url);
  if (parsed.hostname !== "localhost") return [url];

  return ["localhost", "127.0.0.1", "[::1]"].map((hostname) => {
    const candidate = new URL(parsed);
    candidate.hostname = hostname;
    return candidate.href;
  });
}

function determinePort(
  stdout: ReadableStream<Uint8Array>,
  stderr: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error("Timeout: Could not determine port from server output"),
      );
    }, STARTUP_TIMEOUT);

    let stdoutData = "";
    let stderrData = "";
    let streamsEnded = 0;

    // Common patterns for port detection
    const portPatterns = [
      /listening on.*:(\d+)/i,
      /server.*:(\d+)/i,
      /port\s*:?\s*(\d+)/i,
      /https?:\/\/localhost:(\d+)/i,
      /https?:\/\/0\.0\.0\.0:(\d+)/i,
      /https?:\/\/127\.0\.0\.1:(\d+)/i,
      /https?:\/\/[^:]+:(\d+)/i,
    ];

    const checkForPort = (data: string) => {
      for (const pattern of portPatterns) {
        const match = data.match(pattern);
        if (match && match[1]) {
          const port = Number.parseInt(match[1], 10);
          if (port > 0 && port < 65536) {
            clearTimeout(timeout);
            return port;
          }
        }
      }
      return null;
    };

    const onStreamEnd = () => {
      streamsEnded++;
      if (streamsEnded === 2) {
        clearTimeout(timeout);
        reject(
          new Error("Server exited before port could be determined"),
        );
      }
    };

    const readStream = async (
      stream: ReadableStream<Uint8Array>,
      onData: (chunk: string) => void,
    ) => {
      const reader = stream.getReader();
      const onAbort = () => void reader.cancel().catch(() => {});
      signal?.addEventListener("abort", onAbort, { once: true });
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          onData(decoder.decode(value, { stream: true }));
        }
      } catch {
        // Stream may be cancelled when process is killed
      } finally {
        signal?.removeEventListener("abort", onAbort);
        reader.releaseLock();
        onStreamEnd();
      }
    };

    void readStream(stdout, (chunk) => {
      stdoutData += chunk;
      const port = checkForPort(stdoutData);
      if (port) resolve(port);
    });

    void readStream(stderr, (chunk) => {
      stderrData += chunk;
      const port = checkForPort(stderrData);
      if (port) resolve(port);
    });
  });
}

async function pipeStream(
  readable: ReadableStream<Uint8Array>,
  writable: WriteStream,
  signal?: AbortSignal,
): Promise<void> {
  const reader = readable.getReader();
  const onAbort = () => void reader.cancel().catch(() => {});
  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      writable.write(value);
    }
  } catch {
    // Stream may be cancelled when process is killed
  } finally {
    signal?.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }
}
