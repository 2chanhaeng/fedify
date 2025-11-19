// Custom assertEquals function to work around JSR access issues
function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message ||
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

import actorIdMismatch from "../rules/actor-id-mismatch.ts";

Deno.test("actor-id-mismatch: 규칙 이름 확인", () => {
  assertEquals(typeof actorIdMismatch, "object");
  assertEquals(typeof actorIdMismatch.create, "function");
});

// Deno.lint API를 사용한 실제 테스트

const plugin: Deno.lint.Plugin = {
  name: "fedify-lint-test",
  rules: {
    "actor-id-mismatch": actorIdMismatch,
  },
};

Deno.test("actor-id-mismatch: ✅ Good - id: ctx.getActorUri(identifier)", () => {
  const code = `
    federation.setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
      return new Person({
        id: ctx.getActorUri(identifier),
        name: "John Doe",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", code);

  assertEquals(
    diagnostics.length,
    0,
    "Should not report any issues for correct usage",
  );
});

Deno.test("actor-id-mismatch: ✅ Good - id: context.getActorUri(handle)", () => {
  const code = `
    federation.setActorDispatcher("/users/{handle}", async (context, handle) => {
      return new Person({
        id: context.getActorUri(handle),
        name: "Jane Smith",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", code);

  assertEquals(
    diagnostics.length,
    0,
    "Should not report any issues for correct usage with different parameter names",
  );
});

Deno.test("actor-id-mismatch: ❌ Bad - id: new URL('https://example.com/user/john')", () => {
  const code = `
    federation.setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
      return new Person({
        id: new URL("https://example.com/user/john"),
        name: "John Doe",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", code);

  assertEquals(diagnostics.length, 1, "Should report one issue");
  assertEquals(diagnostics[0].id, "fedify-lint-test/actor-id-mismatch");
  assertEquals(
    diagnostics[0].message,
    "Actor's `id` property must match `ctx.getActorUri(identifier)`. Ensure you're using the correct context method.",
  );
});

Deno.test("actor-id-mismatch: ❌ Bad - id: someOtherVariable", () => {
  const code = `
    federation.setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
      const someOtherVariable = new URL("https://example.com/user/john");
      return new Person({
        id: someOtherVariable,
        name: "John Doe",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", code);

  assertEquals(diagnostics.length, 1, "Should report one issue");
  assertEquals(diagnostics[0].id, "fedify-lint-test/actor-id-mismatch");
  assertEquals(
    diagnostics[0].message,
    "Actor's `id` property must match `ctx.getActorUri(identifier)`. Ensure you're using the correct context method.",
  );
});

Deno.test("actor-id-mismatch: ❌ Bad - id using wrong context method", () => {
  const code = `
    federation.setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
      return new Person({
        id: ctx.getInboxUri(identifier),
        name: "John Doe",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", code);

  assertEquals(
    diagnostics.length,
    1,
    "Should report one issue for using wrong context method",
  );
  assertEquals(diagnostics[0].id, "fedify-lint-test/actor-id-mismatch");
});
