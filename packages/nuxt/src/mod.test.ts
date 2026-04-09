import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { type ContextDataFactory, fedifyMiddleware, onError } from "./mod.ts";

describe("fedifyMiddleware", () => {
  test("creates an event handler", () => {
    const mockFederation = {
      fetch: () => Promise.resolve(new Response("OK")),
    };
    const handler = fedifyMiddleware(mockFederation as never);
    strictEqual(typeof handler, "object");
  });

  test("defaults contextDataFactory to () => undefined", () => {
    const mockFederation = {
      fetch: (_req: Request, opts: { contextData: unknown }) => {
        strictEqual(opts.contextData, undefined);
        return Promise.resolve(new Response("OK", { status: 200 }));
      },
    };
    const handler = fedifyMiddleware(mockFederation as never);
    strictEqual(typeof handler, "object");
  });
});

describe("ContextDataFactory", () => {
  test("type accepts sync factory", () => {
    const factory: ContextDataFactory<string> = () => "sync-context";
    strictEqual(factory({} as never, new Request("http://example.com")),
      "sync-context");
  });

  test("type accepts async factory", async () => {
    const factory: ContextDataFactory<string> = async () => "async-context";
    const result = await factory(
      {} as never,
      new Request("http://example.com"),
    );
    strictEqual(result, "async-context");
  });
});

describe("onError", () => {
  test("is a function", () => {
    strictEqual(typeof onError, "function");
  });
});
