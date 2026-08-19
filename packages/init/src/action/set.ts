import { pipe } from "@fxts/core";
import { existsSync } from "node:fs";
import { realpath } from "node:fs/promises";
import { basename, normalize } from "node:path";
import { kvStores, messageQueues } from "../lib.ts";
import type {
  InitCommandData,
  InitCommandOptions,
  KvStore,
  KvStoreDescription,
  MessageQueue,
  MessageQueueDescription,
  PackageManager,
  WebFrameworkDescription,
  WebFrameworkInitializer,
} from "../types.ts";
import { merge, set } from "../utils.ts";
import webFrameworks from "../webframeworks/mod.ts";
import { pmToRt } from "../webframeworks/utils.ts";

/**
 * Set all necessary data for initializing the project.
 * This function orchestrates the setting of project name, initializer,
 * key-value store, message queue, and environment variables by calling
 * individual setter functions for each piece of data.
 *
 * @param data - The initial command options provided by the user
 * @returns A promise resolving to a complete InitCommandData object
 */
const setData = (data: InitCommandOptions): Promise<InitCommandData> =>
  pipe(
    data,
    setProjectName,
    setRt,
    setInitializer,
    setKv,
    setMq,
    setEnv,
  );

export default setData;

const setProjectName = set(
  "projectName",
  async <T extends { dir: string }>({ dir }: T) =>
    basename(existsSync(dir) ? await realpath(dir) : normalize(dir)),
);

const setRt = set("rt", <
  T extends { packageManager: PackageManager },
>({ packageManager }: T) => pmToRt(packageManager));

const setInitializer = set("initializer", <
  T extends Parameters<WebFrameworkDescription["init"]>[0],
>(data: T) => webFrameworks[data.webFramework].init(data));

const setKv = set("kv", <
  T extends { kvStore: KvStore },
>({ kvStore }: T) => kvStores[kvStore]);

const setMq = set(
  "mq",
  <
    T extends { messageQueue: MessageQueue },
  >({ messageQueue }: T) => messageQueues[messageQueue],
);

const setEnv = set(
  "env",
  <
    T extends {
      initializer: WebFrameworkInitializer;
      kv: KvStoreDescription;
      mq: MessageQueueDescription;
    },
  >({ initializer, kv, mq }: T) =>
    merge(initializer.env)(merge(kv.env)(mq.env)),
);
