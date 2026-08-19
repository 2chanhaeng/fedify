import { parse } from "@optique/core/parser";
import { ok, strictEqual } from "node:assert/strict";
import test from "node:test";
import { initOptions } from "./command.ts";

test("initOptions parses --skip-smoke-test as true", () => {
  const result = parse(initOptions, ["--skip-smoke-test"]);
  ok(result.success);
  if (result.success) {
    strictEqual(result.value.skipSmokeTest, true);
  }
});

test("initOptions defaults skipSmokeTest to false when absent", () => {
  const result = parse(initOptions, []);
  ok(result.success);
  if (result.success) {
    strictEqual(result.value.skipSmokeTest, false);
  }
});
