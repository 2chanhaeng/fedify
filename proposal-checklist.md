# Fedify 린트 룰 구현 체크리스트

 체크리스트는 [proposal.md](./proposal.md)에 정의된 우선순위에 따라 `@fedify/lint` 패키지의 
트 룰 구현 � 추적합니다.�행 >


## Phase 1: 최우선 순위 룰 ( 필수)

 룰들은 ActivityPub 규격 준수 및 보안에 직접적인 영향을 미치는 오류를 감지합니다.


### Actor 카테고리 (2개 룰)

- [x] `fedify/actor-id-required` (Error) ✅
  - **설명**: Actor dispatcher는 `Context.getActorUri(identifier)`를 통해 설정된 `id` 프로퍼
   티를 가진 actor를 반환해야 합니다
  - **파일**: `packages/lint/src/rules/actor-id-required.ts`
  - **코드 참조**: [builder
   .ts:249-253](packages/fedify/src/federation/builder.ts#L249-L253)
  - **구현 노트**: Actor dispatcher가 `id` 프로퍼티를 가진 객체를 반환하는지 확인
   
  - **구현 완료**: 2025-11-18

- [x] `fedify/actor-id-mismatch` (Error) ✅
   
  - **설명**: Actor의 `id` 프로퍼티는 `Context.getActorUri(identifier)`가 반환하는 URI와 일치해야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-id-mismatch.ts`
  - **코드 참조**: [builder.ts:254-260](packages/fedify/src/fede
   ration/builder.ts#L254-L260)
  - **구현 노트**: `actor.id`가 `ctx.getActorUri(identifier)` 호출 결과와 일치하는지 검증
  - **구현 완료**: 2025-11-18

### Keys 카테고리 (5개 룰)

   
- [ ] `fedify/actor-public-key-required` (Error)
  - **설명**: Key pairs d
   ispatcher가 설정된 경우, actor는 `Context.getActorKeyPairs(identifier)`를 통해 설정 `publicKey` 프로퍼티를 가져야 합니다
  - **파일**: `packages/lint/src/rules/actor-public-key-required.ts`
   
  - **코드 참조**: [builder.ts:418-423](packages/fedify/src/federation/builder.ts#L418-L423)
  - **구현 노트**: `setActorKeyPairsDispatcher()`가 설정되었고 actor가 `publicKey`를 가지는지 확인

   
- [ ] `fedify/actor-assertion-method-required` (Error)
  - **설명**: Key pairs d
   ispatcher가 설정된 경우, actor는 `Context.getActorKeyPairs(identifier)`를 통해 설정된 `assertionMethod` 프로퍼티를 가져야 합니다
  - **파일**: `packages/lint/src/rules/actor-assertion-method-required.ts`
   
  - **코드 참조**: [builder.ts:425-431](packages/fedify/src/federation/builder.ts#L425-L431)
  - **구현 노트**: `setActorKeyPairsDispatcher()`가 설정되었고 actor가 `assertionMethod`를 가지는지 확인

   
- [ ] `fedify/rsa-key-required-for-http-signature` (Warning)
  - **설명**: HTTP 요청에 서명
   하기 위해 최소한 하나의 RSASSA-PKCS1-v1_5 키가 제공되어야 합니다
  - **파일**: `packages/lint/src/rules/rsa-key-required-for-http-signature.ts`
   
  - **코드 참조**: [send.ts:216-228](packages/fedify/src/federation/send.ts#L216-L228)
  - **구현 노트**: Key pairs dispatcher가 최소한 하나의 RSA 키를 반환하는지 검증

   
- [ ] `fedify/rsa-key-required-for-ld-signature` (Warning)
  - **설명**: Linked Data
    서명을 생성하기 위해 최소한 � RSASSA-PKCS1-v1_5 키가 제공되어야 합니다�
  - **파일**: `packages/lint/src/rules/rsa-key-required-for-ld-signature.ts`
  - **코드 참조**: [middleware.ts:1013-1023](packages/fedify/src/federation/middleware.ts#L1013-L1023)
  - **구현 노트**: LD 서명이 사용될 때 RSA 키가 있는지 확인

   
- [ ] `fedify/ed25519-key-required-for-proof` (Warning)
  - **설명**: Object Inte
   grity Proofs를 생성하기 위    최소한 하나의 Ed25519 키가 제공되어야 합니다
  - **파일**: `packages/lint/src/rules/ed25519-key-required-for-proof.ts`
   
  - **코드 참조**: [middleware.ts:1033-1043](packages/fedify/src/federation/middleware.ts#L1033-L1043)
  - **구현 노트**: Object Integrity Proofs가 사용될 때 Ed25519 키가 있는지 확인

### Inbox 카테고리 (4개 룰)

   
- [ ] `fedify/actor-inbox-property-required` (Warning)
  - **설명**: Inbox liste
   ner가 설정된 경우, actor는 `Context.getInboxUri(identifier)`를 통해 설정된 `inbox` 프로퍼티를 가져야 합니
  - **파일**: `packages/lint/src/rules/actor-inbox-property-required.ts`
   
  - **코드 참조**: [builder.ts:386-391](packages/fedify/src/federation/builder.ts#L386-L391)
  - **구현 노트**: ` actor가 `inbox`를 가지는지 확인

   
- [ ] `fedify/actor-inbox-property-mismatch` (Warning)
  - **설명**: Actor의 `inb
   ox` 프로퍼티는 `Context.getInboxUri(identifier)`가 반환하는 URI와 일치해야 합니다
  - **파일**: `packages/lint/src/rules/actor-inbox-property-
   mismatch.ts`
  ** - 참조**: [builder.ts:392-400](packages/fedify/src/federation/builder.ts#L392-L400)
  - **구현 노트**: `actor.inbox`가 `ctx.getInboxUri(identifier)`와 일치하는지 
- [ ] `fedify/actor-shared-inbox-property-required` (Warning)
   
  - **설명**: Inbox listener가 설정된 경우, actor는 `Context.getInboxUri()`를 통해 설정된 `endpoints.sharedInbox` 프로퍼티를 가져야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-shared-inbox-property-required.ts`
  - **코드 참조**: [builder.ts:401-406](packages/fedify/src/federation/builder.ts
   #L401-L406)
  - **구현 노트**: `setInboxListeners()`가 설정되었고 actor가 `endpoints.sharedInbox`를 가지는지 확인

- [ ] `fedify/actor-shared-inbox-property-mismatch` (Warning)
   
  - **설**: Actor의 `endpoints.sharedInbox` 프로퍼티는 `Context.getInboxUri()`가 반환하는 URI와 일치해야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-shared-inbox-property-mismatch.ts`
  - **코드 참조**: [builder.ts:407-415](packages/fedify/src/federation/builder
   .ts#L407-L415)
  - **구현 노트**: `actor.endpoints.sharedInbox`가 `ctx.getInboxUri()`와 일치하는지 검증

**Phase 1 진행률**: 2/11개 룰 구현됨 (18.2%)

---

## Phase 2: 중간 우선순위 룰 (Collection 설)

 룰들은 적절한 collection 설정을 보장합니다.

### Collection 카테고리 - Following (2개 룰)

- [ ] `fedify/actor-following-property-required` (Warning)
   
   
  - **설명**: Following collection dispatcher가 설정된 경우, actor는 `Context.getFollowingUri(identifier)`를 통해 설정된 `following` 프로퍼티를 가져야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-following-property-required.ts`
  - **코 참조**: [builder.ts:265-270](packages/fedify/src/federation/builder.ts
   #L265-L270)
  - **구현 노트**: `setFollowingDispatcher()`가 설정되었고 actor가 `following`을 가지는지 확인

- [ ] `fedify/actor-following-property-mismatch` (Warning)
   
git vocab/runtime checkout `Context.getFollowingUri(identifier)`가 반환하는 URI와 일치해야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-following-property-mismatch.ts`
  - **코드 참조**: [builder.ts:271-280](packages/fedify/src/federa
   tion/builder.ts#L271-L280)
  - **구현 노트**: `actor.following`이 `ctx.getFollowingUri(identifier)일치하 `와 검증

### Collection 카테고리 - Followers (2개 룰)

- [ ] `fedify/actor-followers-property-required` (Warning)
   
   
  - **설명**: Followers collection dispatcher가 설정된 경우, actor는 `Context.getFollowersUri(identifier)`를 통해 설정된 `followers` 프로퍼티를 가져야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-followers-property-required.ts`
  - **코드 참조**: [builder.ts:286-291](packages/fedify/src/federation/builder.t
   s#L286-L291)
  - **구현 노트**: `setFollowersDispatcher()`가 설정되었고 actor가 `followers`를 가지는지 확인

- [ ] `fedify/actor-followers-property-mismatch` (Warning)
   
  - **설명**: Actor의 `followers` 프로퍼티는 `Context.getFollowersUri(identifier)`가 반환하는 URI와 일치해야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-followers-property-mismatch.ts`
  - **코드 참조**: [builder.ts:292-301](packages/fedify/src/federa
   tion/builder.ts#L292-L301)
  - **구현 노트**: `actor.followers`가 `ctx.getFollowersUri(identifier)`와 일치하는지 검증

### Collection 카테고리 - Outbox (2개 룰)

- [ ] `fedify/actor-outbox-property-required` (Warning)
   
  - **설명**: Outbox collection dispatcher가 설정된 경우, actor는 `Context.getOutboxUri(identifier)`를 통해 설정된 `outbox` 프로퍼티를 가져야 합니다
  - **파**: `packages/li
   nt/src/rules/actor-outbox-property-required.ts`
  - **코드 참조**: [builder.ts:307-312](packages/fedify/src/federation/builder.ts#L
   307-L312)
  - **구현 노트**: `setOutboxDispatcher()`가 설정되었고 actor가 `outbox`를 가지는지 확인

- [ ] `fedify/actor-outbox-property-mismatch` (Warning)
   
  - **설명**: Actor의 `outbox` 프로퍼티는 `Context.getOutboxUri(identifier)` 반환하는 URI와 일치해야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-outbox-property-mismatch.ts`
  - **코 참조**: [builder.ts:313-321](packages/fedify/src/fede
   ration/builder.ts#L313-L321)
  - **구현 노트**: `actor.outbox`가 `ctx.getOutboxUri(identifier)`와 일치하는지 검증

### Collection 카테고리 - Liked (2개 룰)

- [ ] `fedify/actor-liked-property-required` (Warning)
   
  - **설명**: Liked collection dispatcher가 설정된 actor 경우, `Context.getLikedUri(identifier)`를 통해 설정된 `liked` 프로퍼티를 가져야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-liked-property-required.ts`
  - **코드 참조**: [builder.ts:327-332](packages/fedify/src/federation/builder.ts#
   L327-L332)
  - **구현 노트**: `setLikedDispatcher()`가 설정되었고 actor가 `liked`를 가지는지 확인

- [ ] `fedify/actor-liked-property-mismatch` (Warning)
   
  - **설명**: Actor의 `liked` 프로퍼티는 `Context.getLikedUri(identifier)`가 반환하는 URI와 일치해야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-liked-property-mismatch.ts`
  - **코드 참조**: [builder.ts:333-341](packages/fedify/src/fe
   deration/builder.ts#L333-L341)
  - **구현 노트**: `actor.liked`가 `ctx.getLikedUri(identifier)`와 일치하는지 검증

### Collection 카테고리 - Featured (2개 룰)

- [ ] `fedify/actor-featured-property-required` (Warning)
   
  - **설명**: Featured collection dispatcher가 설정된 경우, actor는 `Context.getFeaturedUri(identifier)`를 통해 설정된 `featured` 프로퍼티를 가져야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-featured-property-required.ts`
  - **코드 참조**: [builder.ts:347-352](packages/fedify/src/federation/builder.
   ts#L347-L352)
  - **구현 노트**: ` actor가 `featured`를 가지는지 확인

- [ ] `fedify/actor-featured-property-mismatch` (Warning)
   
  - **설명**: Actor의 `featured` 프로퍼티는 `Context.getFeaturedUri(identifier)`가 반환하는 URI와 일치해야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-featured-property-mismatch.ts`
  - **코드 참조**: [builder.ts:353-361](packages/fedify/src/feder
   ation/builder.ts#L353-L361)
  - **구현 노트**: `actor.featured`가 `ctx.getFeaturedUri(identifier)`와 일치하는지 검증

### Collection 카테고리 - Featured Tags (2개 룰)

- [ ] `fedify/actor-featured-tags-property-required` (Warning)
   
   
  - **설명**: Featured tags collection dispatcher가 설정된 경우, actor는 `Context.getFeaturedTagsUri(identifier)`를 통해 설정된 `featuredTags` 프로퍼티를 가져야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-featured-tags-property-required.ts`
  - **코드 참조**: [builder.ts:367-372](packages/fedify/src/federation/builder.ts#L
   367-L372)
  - **구현 노트**: `setFeaturedTagsDispatcher()`가 설정되었고 actor가 `featuredTags`를 가지는지 확인

- [ ] `fedify/actor-featured-tags-property-mismatch` (Warning)
   
  - **설명**: Actor의 `featuredTags` 프로퍼티는 `Context.getFeaturedTagsUri(identifier)`가 반환하는 URI와 일치해야 합니다
  - **파일**: `packages/l
   int/src/rules/actor-featured-tags-property-mismatch.ts`
  - **코드 참조**: [builder.ts:373-383](packages/fedify/src/federatio
   n/builder.ts#L373-L383)
  - **구현 노트**: `actor.featuredTags`가 `ctx.getFeaturedTagsUri(identifier)`와 일치하는지 검증

**Phase 2 진행률**: 0/12개 룰 구현됨

---

## Phase 3: 낮은 우선순위 룰 (성능 최적화)

### Collection 카테고리 - 최적화 (1개 룰)

- [ ] `fedify/collection-filtering-not-implemented` (Warning)
   
  - **설명**: Collection은 큰 응답 페이로드를 피하기 위해 필� 구현해야 합니다��
  - **파일**: `packages/l
   int/src/rules/collection-filtering-not-implemented.ts`
  - **코드 참*: [handler.ts:496-504](packages/fedify/src/federation/handler.ts#L496-L504)
  - **문서**: https://fedify.dev/manual/collections#filtering-by-server
   
  - **구현 노트**: Collection dispatcher가 필터링 구현하 매개변수를 확인

**Phase 3 진행률**: 0/1개 룰 구현됨

---

## 전체 진행률

- **전체 룰**: 24개 (proposal에서 23개 + 통합 추적)
- **구현됨**: 2개 (8.3%)
- **남은 것**: 22개


### 카테고리별

- **Actor**: 2/2개 구현됨 ✅ **완료!**
- **Keys**: 0/5개 구현됨
- **Inbox**: 0/4개 구현됨
- **Collection**: 0/12개 구현됨


### 심각도별

- **Error**: 2/4개 구현됨 (50%)
- **Warning**: 0/19개 구현됨

---


## 구현 전략

### 1단계: 인프라 설정

- [ ] 공통 유틸리티가 있는 기본 룰 템플릿 생성

- [ ] 린트 룰용 테스트 프레임워크 설정
- [ ] 다양한 Fedify 설정을 위한 테스        픽스처 생성

### 2단계: Phase 1 구현 (최우선 순위)


- Actor, Keys, Inbox 카테고리에 집중
- ActivityPub 규격 준수에 필수적
- 목표: 11개 룰

### 3단계: Phase 2 구현 (중간 우선순위)


- Collection 프로퍼티 룰에 집중
- 적절한 federation 설정 보장
- 목표: 12개 룰


### 4단계: Phase 3 구현 (낮은 우선순위)

- 성능 최적화 룰
#- 목표: 1개 


### 5단계: 테스트 및 문서화

- [ ] 실제 Fedify 프로젝트에 대해 모든 룰 테스트
 
- [ ] 각 룰에 대한 문서 작성
 
- [ ] 기존 프로젝트를 위한 마이그레이 가이드 작성
 
- [ ] 가능한 경우 자동 수정 기능 추가
 

---

## 참고 사항

- **정적 분석 제한사항**: 일부 룰은 함수 호출을 통한 반환 값 추적이 이 필요하며, AST 기반 분석만으로는 어려울 수 있습니다
- **테스트 전략**: 각 룰은 긍정적         케이스(통과해야 함)와 부정적 테스트 케이스(실패해야 함)를 가져야 합니다
- **> 수정 가능성**: `- (예: 누락된 프로퍼티 할당 삽입)
- **패턴 매칭**: `-mismatch`  있는 룰은 두 값을 비교해야 합니다 (예: `actor.id` vs `ctx.getActorUri(identifier)`)접미
