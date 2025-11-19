import {
  assertEquals,
  assertGreaterOrEqual,
  assertStringIncludes,
} from "./test-helpers.ts";
import actorIdMismatch from "../rules/actor-id-mismatch.ts";

const plugin: Deno.lint.Plugin = {
  name: "fedify-lint-test",
  rules: {
    "actor-id-mismatch": actorIdMismatch,
  },
};

Deno.test("actor-id-mismatch: 규칙 이름 확인", () => {
  assertEquals(typeof actorIdMismatch, "object");
  assertEquals(typeof actorIdMismatch.create, "function");
});

Deno.test("actor-id-mismatch: ✅ Good - id: ctx.getActorUri(identifier)", () => {
  const sourceCode = `
    federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => {
      return new Person({
        id: ctx.getActorUri(identifier),
        name: "John Doe",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", sourceCode);
  assertEquals(
    diagnostics.length,
    0,
    "Should not report any issues for correct usage",
  );
});

Deno.test("actor-id-mismatch: ✅ Good - id: context.getActorUri(handle)", () => {
  const sourceCode = `
    federation.setActorDispatcher("/users/{handle}", (context, handle) => {
      return new Person({
        id: context.getActorUri(handle),
        name: "Jane Doe",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", sourceCode);
  assertEquals(
    diagnostics.length,
    0,
    "Should not report any issues with different parameter names",
  );
});

Deno.test("actor-id-mismatch: ✅ Good - object literal without new", () => {
  const sourceCode = `
    federation.setActorDispatcher("/users/{id}", (ctx, id) => {
      return {
        id: ctx.getActorUri(id),
        name: "Bob",
      };
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", sourceCode);
  assertEquals(
    diagnostics.length,
    0,
    "Should not report issues for object literal with correct id",
  );
});

Deno.test("actor-id-mismatch: ✅ Good - arrow function with expression body", () => {
  const sourceCode = `
    federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => 
      new Person({
        id: ctx.getActorUri(identifier),
        name: "Alice",
      })
    );
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", sourceCode);
  assertEquals(
    diagnostics.length,
    0,
    "Should not report issues with expression body",
  );
});

Deno.test("actor-id-mismatch: ✅ Good - block body with direct return", () => {
  const sourceCode = `
    federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => {
      return new Person({
        id: ctx.getActorUri(identifier),
        name: "Bob",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", sourceCode);
  assertEquals(
    diagnostics.length,
    0,
    "Should not report issues with block body and direct return",
  );
});

Deno.test("actor-id-mismatch: ❌ Bad - id: new URL(...)", () => {
  const sourceCode = `
    federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => {
      return new Person({
        id: new URL("https://example.com/user/john"),
        name: "John",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", sourceCode);
  assertGreaterOrEqual(
    diagnostics.length,
    1,
    "Should report an issue for hardcoded URL",
  );
  assertStringIncludes(
    diagnostics[0].message,
    "ctx.getActorUri(identifier)",
    "Error message should mention correct pattern",
  );
});

Deno.test("actor-id-mismatch: ❌ Bad - id: someOtherVariable", () => {
  const sourceCode = `
    federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => {
      const someUrl = new URL("https://example.com/user");
      return new Person({
        id: someUrl,
        name: "John",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", sourceCode);
  assertGreaterOrEqual(
    diagnostics.length,
    1,
    "Should report an issue for wrong variable",
  );
  assertStringIncludes(
    diagnostics[0].message,
    "ctx.getActorUri(identifier)",
    "Error message should mention correct pattern",
  );
});

Deno.test("actor-id-mismatch: ❌ Bad - wrong method call", () => {
  const sourceCode = `
    federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => {
      return new Person({
        id: ctx.getSomethingElse(identifier),
        name: "John",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", sourceCode);
  assertGreaterOrEqual(
    diagnostics.length,
    1,
    "Should report an issue for wrong method",
  );
  assertStringIncludes(
    diagnostics[0].message,
    "getActorUri",
    "Error message should mention getActorUri",
  );
});

Deno.test("actor-id-mismatch: ❌ Bad - wrong parameter in getActorUri", () => {
  const sourceCode = `
    federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => {
      return new Person({
        id: ctx.getActorUri("hardcoded"),
        name: "John",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", sourceCode);
  assertGreaterOrEqual(
    diagnostics.length,
    1,
    "Should report an issue for wrong parameter",
  );
});

Deno.test("actor-id-mismatch: ❌ Bad - missing id property", () => {
  const sourceCode = `
    federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => {
      return new Person({
        name: "John",
      });
    });
  `;

  const diagnostics = Deno.lint.runPlugin(plugin, "test.ts", sourceCode);
  assertGreaterOrEqual(
    diagnostics.length,
    1,
    "Should report an issue for missing id property",
  );
});
