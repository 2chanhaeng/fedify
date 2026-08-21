import { assertEquals } from "@std/assert";
import { join } from "node:path";
import { test } from "node:test";
import { matchesLookupCasePattern, parseLookupCase } from "./test/lookup.ts";

test("parseLookupCase() parses the last four path segments", () => {
  assertEquals(
    parseLookupCase(join("/tmp", "cases", "hono", "deno", "denokv", "redis")),
    ["hono", "deno", "denokv", "redis"],
  );
});

test("matchesLookupCasePattern() supports wildcards", () => {
  assertEquals(
    matchesLookupCasePattern(["solidstart", "deno", "postgres", "redis"])(
      ["solidstart", "deno", "*", "*"],
    ),
    true,
  );
  assertEquals(
    matchesLookupCasePattern(["solidstart", "npm", "postgres", "redis"])(
      ["solidstart", "deno", "*", "*"],
    ),
    false,
  );
});
