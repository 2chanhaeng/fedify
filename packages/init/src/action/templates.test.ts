import { doesNotMatch, equal, match } from "node:assert/strict";
import test from "node:test";
import type { InitCommandData } from "../types.ts";
import { convertEnv, getImports } from "./templates.ts";

const REDIS = "new RedisKvStore(new Redis(process.env.REDIS_URL))";

test("convertEnv() rewrites process.env for the framework and runtime", () => {
  equal(
    convertEnv(REDIS, { packageManager: "npm", webFramework: "hono" }),
    "new RedisKvStore(new Redis(process.env.REDIS_URL))",
  );
  equal(
    convertEnv(REDIS, { packageManager: "deno", webFramework: "hono" }),
    'new RedisKvStore(new Redis(Deno.env.get("REDIS_URL")))',
  );
  for (const packageManager of ["npm", "deno", "bun"] as const) {
    equal(
      convertEnv(REDIS, { packageManager, webFramework: "astro" }),
      "new RedisKvStore(new Redis(import.meta.env.REDIS_URL))",
    );
    equal(
      convertEnv(REDIS, { packageManager, webFramework: "sveltekit" }),
      "new RedisKvStore(new Redis(env.REDIS_URL))",
    );
  }
  equal(
    convertEnv(REDIS, { packageManager: "deno", webFramework: "solidstart" }),
    'new RedisKvStore(new Redis(Deno.env.get("REDIS_URL")))',
  );
});

test("convertEnv() leaves snippets without environment variables alone", () => {
  const snippet = "new MemoryKvStore()";
  for (const webFramework of ["hono", "astro", "sveltekit"] as const) {
    equal(
      convertEnv(snippet, { packageManager: "deno", webFramework }),
      snippet,
    );
  }
});

const importsData = (
  webFramework: InitCommandData["webFramework"],
  env: Record<string, string>,
): InitCommandData =>
  ({
    webFramework,
    packageManager: "npm",
    env,
    kv: {
      imports: { "@fedify/redis": { RedisKvStore: "RedisKvStore" } },
      object: REDIS,
    },
    mq: { imports: {}, object: "new InProcessMessageQueue()" },
  }) as unknown as InitCommandData;

test("getImports() adds the SvelteKit env module only when needed", () => {
  const withEnv = getImports(
    importsData("sveltekit", { REDIS_URL: "redis://localhost:6379" }),
  );
  match(withEnv, /^import \{ env \} from "\$env\/dynamic\/private";$/m);
  match(withEnv, /^import \{ RedisKvStore \} from "@fedify\/redis";$/m);

  doesNotMatch(getImports(importsData("sveltekit", {})), /\$env\/dynamic/);
  doesNotMatch(
    getImports(importsData("astro", { REDIS_URL: "redis://localhost:6379" })),
    /\$env\/dynamic/,
  );
});
