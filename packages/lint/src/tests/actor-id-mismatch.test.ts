import { assertEquals } from "@std/assert";
import actorIdMismatch from "../rules/actor-id-mismatch.ts";

Deno.test("actor-id-mismatch: 규칙 이름 확인", () => {
  assertEquals(typeof actorIdMismatch, "object");
  assertEquals(typeof actorIdMismatch.create, "function");
});

// TODO: Deno.lint API를 사용한 실제 테스트 추가
// - ✅ Good: id: ctx.getActorUri(identifier)
// - ❌ Bad: id: new URL("https://example.com/user/john")
// - ❌ Bad: id: someOtherVariable
// - ✅ Good: id: context.getActorUri(handle)
