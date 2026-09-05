import { deepStrictEqual } from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { matchesLookupCasePattern, parseLookupCase } from "./test/lookup.ts";

test("parseLookupCase() parses the last four path segments", () => {
  deepStrictEqual(
    parseLookupCase(join("/tmp", "cases", "hono", "deno", "denokv", "redis")),
    ["hono", "deno", "denokv", "redis"],
  );
});

test("matchesLookupCasePattern() supports wildcards", () => {
  deepStrictEqual(
    matchesLookupCasePattern(["solidstart", "deno", "postgres", "redis"])(
      ["solidstart", "deno", "*", "*"],
    ),
    true,
  );
  deepStrictEqual(
    matchesLookupCasePattern(["solidstart", "npm", "postgres", "redis"])(
      ["solidstart", "deno", "*", "*"],
    ),
    false,
  );
});
