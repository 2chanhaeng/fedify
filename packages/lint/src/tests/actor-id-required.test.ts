import { assertEquals } from "./test-helpers.ts";
import actorIdRequired from "../rules/actor-id-required.ts";

Deno.test("actor-id-required: 규칙 이름 확인", () => {
  assertEquals(typeof actorIdRequired, "object");
  assertEquals(typeof actorIdRequired.create, "function");
});

// TODO: Deno.lint API를 사용한 실제 테스트 추가
// - ✅ Good: id 프로퍼티가 있는 경우
// - ❌ Bad: id 프로퍼티가 없는 경우
// - ✅ Good: new Person({ id: ctx.getActorUri(identifier) })
// - ❌ Bad: new Person({ name: "John" }) without id
