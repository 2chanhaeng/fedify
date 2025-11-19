# 정적 분석 가능 항목 (린트 룰 개발 대상)

## 1. **필수 설정 누락 검증**

### `@fedify/lint/require-actor-dispatcher`

- **문제**: Actor dispatcher가 설정되지 않음
- **참조**:
  [handler.ts#L86-L87](./packages/fedify/src/federation/handler.ts#:86-87)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**: `Federation` 또는 `createFederation()` 사용 시
  `.setActorDispatcher()` 호출 여부 확인
- **예시**:
  ```typescript
  // ❌ Bad
  const federation = createFederation({ ... });

  // ✅ Good
  const federation = createFederation({ ... })
    .setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
      // ...
    });
  ```

### `@fedify/lint/require-inbox-listeners`

- **문제**: Inbox listener 설정 시 필수 속성 누락
- **참조**: warn 로그 분석 결과 (builder.ts)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**: Inbox listener 설정 시 actor가 `inboxId`,
  `endpoints.sharedInbox` 반환하는지 확인

## 2. **HTTP Signature 검증 설정**

### `@fedify/lint/require-signature-verification`

- **문제**: HTTP Signature 검증을 수행하지 않음
- **참조**: [http.ts#L642-L664](./packages/fedify/src/sig/http.ts#:642-664)
- **린트 가능 여부**: ⚠️ **제한적**
- **검증 방법**: Inbox handler에서 `verifyRequest()` 또는 유사 검증 함수 호출
  여부 확인
- **참고**: Fedify 내부적으로 자동 검증하므로 사용자 코드보다는 Fedify 내부 코드
  품질 검증용

## 3. **타입 안전성 검증**

### `@fedify/lint/require-integer-timestamp`

- **문제**: `expires`, `created` 값이 정수가 아님
- **참조**: [http.ts#L768-L770](./packages/fedify/src/sig/http.ts#:768-770),
  [http.ts#L792-L794](./packages/fedify/src/sig/http.ts#:792-794)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**: Signature 생성 시 `expires`, `created` 필드에 정수형 값
  전달하는지 확인
- **예시**:
  ```typescript
  // ❌ Bad
  const signature = {
    created: "1234567890", // string
    expires: Date.now() / 1000, // float 가능성
  };

  // ✅ Good
  const signature = {
    created: Math.floor(Date.now() / 1000),
    expires: Math.floor(Date.now() / 1000) + 300,
  };
  ```

## 4. **필수 필드 검증**

### `@fedify/lint/require-signature-fields`

- **문제**: Signature 헤더에 필수 필드 누락
- **참조**: [http.ts#L747-L761](./packages/fedify/src/sig/http.ts#:747-761)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**: HTTP Signature 생성 시 `keyId`, `headers`, `signature` 필드
  포함 여부 확인
- **참고**: 주로 Fedify 내부 코드 또는 저수준 API 사용 시

### `@fedify/lint/require-key-public-key`

- **문제**: 키 객체에 `publicKeyPem` 필드 없음
- **참조**: [key.ts#L364-L366](./packages/fedify/src/sig/key.ts#:364-366)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**: Actor 반환 시 `publicKey` 또는 `assertionMethod` 설정 확인
- **예시**:
  ```typescript
  // ❌ Bad
  return new Person({
    id: ctx.getActorUri(identifier),
    // publicKey 없음
  });

  // ✅ Good
  return new Person({
    id: ctx.getActorUri(identifier),
    publicKey: await ctx.getActorKeyPairs(identifier),
  });
  ```

## 5. **Actor/Collection ID 일치성 검증**

### `@fedify/lint/require-matching-actor-id`

- **문제**: Actor의 ID가 예상된 URI와 불일치
- **참조**: warn 로그 분석 결과 (builder.ts#L255-L258)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**: Actor dispatcher에서 반환하는 actor의 `id`가
  `context.getActorUri(identifier)`와 일치하는지 확인
- **예시**:
  ```typescript
  // ❌ Bad
  .setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
    return new Person({
      id: new URL(`https://example.com/user/${identifier}`),
      // ...
    });
  });

  // ✅ Good
  .setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
    return new Person({
      id: ctx.getActorUri(identifier), // 올바른 URI 사용
      // ...
    });
  });
  ```

### `@fedify/lint/require-matching-collection-ids`

- **문제**: Collection dispatcher 설정 시 대응하는 ID 프로퍼티 불일치
- **참조**: warn 로그 분석 결과 (builder.ts#L266-L378)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**:
  - `setFollowingDispatcher()` 사용 시 → actor에
    `following: ctx.getFollowingUri()` 설정 확인
  - `setFollowersDispatcher()` 사용 시 → actor에
    `followers: ctx.getFollowersUri()` 설정 확인
  - `setOutboxDispatcher()` 사용 시 → actor에 `outbox: ctx.getOutboxUri()` 설정
    확인
  - 등등

## 6. **Deprecated API 사용 검출**

### `@fedify/lint/no-deprecated-handle-variable`

- **문제**: `{{handle}}` 변수 사용 (deprecated)
- **참조**: warn 로그 분석 결과 (builder.ts#L207, L648, L725, ...)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**: URI 템플릿에 `{handle}` 사용 시 경고, `{identifier}` 권장
- **예시**:
  ```typescript
  // ❌ Bad
  .setActorDispatcher("/users/{handle}", ...)

  // ✅ Good
  .setActorDispatcher("/users/{identifier}", ...)
  ```

### `@fedify/lint/no-deprecated-handle-property`

- **문제**: `.handle` 프로퍼티 접근 (deprecated)
- **참조**: warn 로그 분석 결과 (middleware.ts#L1736, L1752, ...)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**: `ParseUriResult.handle`, `sender.handle` 등 접근 시 경고
- **예시**:
  ```typescript
  // ❌ Bad
  const username = parseUri.handle;

  // ✅ Good
  const username = parseUri.identifier;
  ```

## 7. **중복 설정 방지**

### `@fedify/lint/no-duplicate-dispatcher`

- **문제**: 동일한 dispatcher를 중복 설정
- **참조**: [builder.ts#L195](./packages/fedify/src/federation/builder.ts#:195)
  [builder.ts#L488](./packages/fedify/src/federation/builder.ts#:488) 등
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**: Federation 빌더 체인에서 동일한 메서드(`.setActorDispatcher()`,
  `.setInboxListeners()`, 등) 중복 호출 검출
- **예시**:
  ```typescript
  // ❌ Bad - 중복 설정
  const federation = createFederation({ ... })
    .setActorDispatcher("/users/{identifier}", ...)
    .setActorDispatcher("/actors/{identifier}", ...); // RouterError 발생

  // ✅ Good - 한 번만 설정
  const federation = createFederation({ ... })
    .setActorDispatcher("/users/{identifier}", ...);
  ```

### `@fedify/lint/no-duplicate-inbox-listeners`

- **문제**: Inbox listeners 중복 설정
- **참조**:
  [builder.ts#L1147](./packages/fedify/src/federation/builder.ts#:1147)- **린트
  가능 여부**: ✅ **가능**
- **검증 방법**: `.setInboxListeners()` 중복 호출 검출

## 8. **URI 템플릿 변수 검증**

### `@fedify/lint/require-valid-uri-template-variables`

- **문제**: URI 템플릿에 필수 변수가 없거나 잘못된 변수 사용
- **참조**:
  [builder.ts#L197-L205](./packages/fedify/src/federation/builder.ts#:197-205)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**: 각 dispatcher의 path 파라미터에 올바른 변수 포함 여부 확인
  - `setActorDispatcher()`: `{identifier}` 또는 `{handle}` 필수 (하나만)
  - `setInboxListeners()`: `{identifier}` 또는 `{handle}` 필수 (하나만)
  - `setNodeInfoDispatcher()`: 변수 없어야 함
  - Shared inbox path: 변수 없어야 함
- **예시**:
  ```typescript
  // ❌ Bad - 잘못된 변수
  .setActorDispatcher("/users/{id}", ...) // 'identifier' 아님
  .setActorDispatcher("/users/{identifier}/{extra}", ...) // 변수 2개
  .setNodeInfoDispatcher("/nodeinfo/{version}", ...) // 변수 있음

  // ✅ Good
  .setActorDispatcher("/users/{identifier}", ...)
  .setNodeInfoDispatcher("/nodeinfo/2.1", ...)
  ```

## 9. **Path 일치성 검증**

### `@fedify/lint/require-matching-inbox-paths`

- **문제**: Inbox dispatcher path와 inbox listener path가 불일치
- **참조**:
  [builder.ts#L1150-L1154](./packages/fedify/src/federation/builder.ts#:1150-1154)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**:
  - Inbox dispatcher 설정 시 사용한 path와
  - Inbox listeners 설정 시 사용한 path가 일치하는지 확인
- **예시**:
  ```typescript
  // ❌ Bad
  .setInboxDispatcher("/users/{identifier}/inbox", ...)
  .setInboxListeners("/actors/{identifier}/inbox") // 경로 불일치

  // ✅ Good
  .setInboxDispatcher("/users/{identifier}/inbox", ...)
  .setInboxListeners("/users/{identifier}/inbox")
  ```

## 10. **필수 반환값 검증**

### `@fedify/lint/require-actor-return-value`

- **문제**: Actor dispatcher가 null을 반환할 수 있지만 적절한 처리 없음
- **참조**: [builder.ts#L247](./packages/fedify/src/federation/builder.ts#:247)-
  **린트 가능 여부**: ⚠️ **제한적** (타입 체크로 일부 가능)
- **검증 방법**: Actor dispatcher 콜백이 항상 Actor 반환하거나 null 처리 로직
  포함 확인

## 11. **Context 메서드 올바른 사용**

### `@fedify/lint/no-recursive-context-method-calls`

- **문제**: Dispatcher 내부에서 동일한 context 메서드 재귀 호출
- **참조**: warn 로그 분석 (middleware.ts#L2587, L2621)
- **린트 가능 여부**: ✅ **가능**
- **검증 방법**:
  - Actor dispatcher 내부에서 `context.getActor()` 호출 금지
  - Object dispatcher 내부에서 `context.getObject()` 호출 금지
  - Actor key pairs dispatcher 내부에서 `context.getActorKeyPairs()` 호출 금지
- **예시**:
  ```typescript
  // ❌ Bad - 무한 재귀 위험
  .setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
    const actor = await ctx.getActor(identifier); // 재귀 호출!
    return actor;
  })

  // ✅ Good - 데이터베이스에서 직접 가져오기
  .setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
    const user = await db.getUser(identifier);
    return new Person({ ... });
  })
  ```

## 12. **Type Guard 패턴**

### `@fedify/lint/require-type-guard-for-activity-listeners`

- **문제**: Inbox listener에서 activity 타입 검증 없이 사용
- **린트 가능 여부**: ⚠️ **제한적** (TypeScript type narrowing 검증)
- **검증 방법**: `.on()` 메서드의 activity 파라미터 사용 전 타입 체크 권장

## 13. **Collection Dispatcher 설정 시 Actor 반환값 검증**

### `@fedify/lint/require-collection-property-when-dispatcher-set`

- **문제**: Collection dispatcher 설정 시 Actor가 해당 collection ID를 반환하지
  않음
- **참조**: warn 로그 분석 (builder.ts#L266-L378)
- **린트 가능 여부**: ⚠️ **제한적** (데이터 흐름 분석 필요)
- **검증 방법**:
  - `.setFollowingDispatcher()` 호출 시 → Actor dispatcher가 `following`
    프로퍼티 반환하는지 확인
  - `.setFollowersDispatcher()` 호출 시 → Actor dispatcher가 `followers`
    프로퍼티 반환하는지 확인
  - 등등

---

# 정리: 린트 룰 개발 우선순위

## 우선순위 1 (필수 설정 및 중복 방지) - 즉시 구현 가능

1. ✅ `@fedify/lint/require-actor-dispatcher` - Actor dispatcher 필수 설정
2. ✅ `@fedify/lint/no-duplicate-dispatcher` - Dispatcher 중복 설정 방지
3. ✅ `@fedify/lint/require-valid-uri-template-variables` - URI 템플릿 변수 검증
4. ✅ `@fedify/lint/require-matching-inbox-paths` - Inbox path 일치성

## 우선순위 2 (Deprecated API) - 즉시 구현 가능

5. ✅ `@fedify/lint/no-deprecated-handle-variable` - `{handle}` 대신
   `{identifier}` 사용
6. ✅ `@fedify/lint/no-deprecated-handle-property` - `.handle` 대신
   `.identifier` 사용

## 우선순위 3 (ID 일치성 검증) - 데이터 흐름 분석 필요

7. ✅ `@fedify/lint/require-matching-actor-id` - Actor ID 일치성
8. ⚠️ `@fedify/lint/require-matching-collection-ids` - Collection ID 일치성
   (복잡)
9. ⚠️ `@fedify/lint/require-collection-property-when-dispatcher-set` -
   Collection dispatcher 설정 시 Actor 프로퍼티 검증

## 우선순위 4 (재귀 호출 방지) - 즉시 구현 가능

10. ✅ `@fedify/lint/no-recursive-context-method-calls` - Context 메서드 재귀
    호출 방지

## 우선순위 5 (타입 및 필드 검증) - TypeScript 타입 분석 필요

11. ✅ `@fedify/lint/require-integer-timestamp` - 타임스탬프 정수형 검증
12. ✅ `@fedify/lint/require-key-public-key` - 키 객체 필수 필드
13. ⚠️ `@fedify/lint/require-signature-fields` - Signature 필수 필드 (고급)

## 우선순위 6 (고급 검증) - 제한적 또는 복잡

14. ⚠️ `@fedify/lint/require-signature-verification` - HTTP Signature 검증
    (제한적)
15. ⚠️ `@fedify/lint/require-actor-return-value` - Actor null 반환 처리 (제한적)
16. ⚠️ `@fedify/lint/require-type-guard-for-activity-listeners` - Activity 타입
    가드 (제한적)

---

# 구현 난이도별 분류

## 🟢 쉬움 (AST 패턴 매칭으로 구현 가능)

- `no-duplicate-dispatcher`
- `require-valid-uri-template-variables`
- `no-deprecated-handle-variable`
- `no-deprecated-handle-property`
- `no-recursive-context-method-calls`
- `require-matching-inbox-paths`

## 🟡 중간 (데이터 흐름 분석 필요)

- `require-actor-dispatcher`
- `require-matching-actor-id`
- `require-integer-timestamp`
- `require-key-public-key`

## 🔴 어려움 (복잡한 타입 및 데이터 흐름 분석 필요)

- `require-matching-collection-ids`
- `require-collection-property-when-dispatcher-set`
- `require-signature-fields`
- `require-signature-verification`
- `require-actor-return-value`
- `require-type-guard-for-activity-listeners`

**권장 개발 순서**: 🟢 → 🟡 → 🔴

**참고**:

- ✅ 표시는 정적 분석으로 충분히 감지 가능
- ⚠️ 표시는 제한적이거나 고급 사용 사례에만 해당
