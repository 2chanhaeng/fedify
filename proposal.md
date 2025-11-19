Based on the analysis of runtime warnings in the
`packages/fedify/src/federation/` directory, here's a proposed list of lint
rules that should be implemented for the `@fedify/lint` package:

### Proposed lint rules

The following table lists 23 lint rules derived from existing runtime warnings
in Fedify. These rules will help developers catch common mistakes during
development rather than at runtime.

| Rule ID                                        | Category   | Severity | Description                                                                                                                                        | Code location                                                                       |
| ---------------------------------------------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `fedify/actor-id-required`                     | Actor      | Error    | Actor dispatcher must return an actor with an `id` property set via `Context.getActorUri(identifier)`                                              | [builder.ts:249-253](packages/fedify/src/federation/builder.ts#L249-L253)           |
| `fedify/actor-id-mismatch`                     | Actor      | Error    | Actor's `id` property must match the URI returned by `Context.getActorUri(identifier)`                                                             | [builder.ts:254-260](packages/fedify/src/federation/builder.ts#L254-L260)           |
| `fedify/actor-following-property-required`     | Collection | Warning  | When following collection dispatcher is configured, actor must have a `following` property set via `Context.getFollowingUri(identifier)`           | [builder.ts:265-270](packages/fedify/src/federation/builder.ts#L265-L270)           |
| `fedify/actor-following-property-mismatch`     | Collection | Warning  | Actor's `following` property must match the URI returned by `Context.getFollowingUri(identifier)`                                                  | [builder.ts:271-280](packages/fedify/src/federation/builder.ts#L271-L280)           |
| `fedify/actor-followers-property-required`     | Collection | Warning  | When followers collection dispatcher is configured, actor must have a `followers` property set via `Context.getFollowersUri(identifier)`           | [builder.ts:286-291](packages/fedify/src/federation/builder.ts#L286-L291)           |
| `fedify/actor-followers-property-mismatch`     | Collection | Warning  | Actor's `followers` property must match the URI returned by `Context.getFollowersUri(identifier)`                                                  | [builder.ts:292-301](packages/fedify/src/federation/builder.ts#L292-L301)           |
| `fedify/actor-outbox-property-required`        | Collection | Warning  | When outbox collection dispatcher is configured, actor must have an `outbox` property set via `Context.getOutboxUri(identifier)`                   | [builder.ts:307-312](packages/fedify/src/federation/builder.ts#L307-L312)           |
| `fedify/actor-outbox-property-mismatch`        | Collection | Warning  | Actor's `outbox` property must match the URI returned by `Context.getOutboxUri(identifier)`                                                        | [builder.ts:313-321](packages/fedify/src/federation/builder.ts#L313-L321)           |
| `fedify/actor-liked-property-required`         | Collection | Warning  | When liked collection dispatcher is configured, actor must have a `liked` property set via `Context.getLikedUri(identifier)`                       | [builder.ts:327-332](packages/fedify/src/federation/builder.ts#L327-L332)           |
| `fedify/actor-liked-property-mismatch`         | Collection | Warning  | Actor's `liked` property must match the URI returned by `Context.getLikedUri(identifier)`                                                          | [builder.ts:333-341](packages/fedify/src/federation/builder.ts#L333-L341)           |
| `fedify/actor-featured-property-required`      | Collection | Warning  | When featured collection dispatcher is configured, actor must have a `featured` property set via `Context.getFeaturedUri(identifier)`              | [builder.ts:347-352](packages/fedify/src/federation/builder.ts#L347-L352)           |
| `fedify/actor-featured-property-mismatch`      | Collection | Warning  | Actor's `featured` property must match the URI returned by `Context.getFeaturedUri(identifier)`                                                    | [builder.ts:353-361](packages/fedify/src/federation/builder.ts#L353-L361)           |
| `fedify/actor-featured-tags-property-required` | Collection | Warning  | When featured tags collection dispatcher is configured, actor must have a `featuredTags` property set via `Context.getFeaturedTagsUri(identifier)` | [builder.ts:367-372](packages/fedify/src/federation/builder.ts#L367-L372)           |
| `fedify/actor-featured-tags-property-mismatch` | Collection | Warning  | Actor's `featuredTags` property must match the URI returned by `Context.getFeaturedTagsUri(identifier)`                                            | [builder.ts:373-383](packages/fedify/src/federation/builder.ts#L373-L383)           |
| `fedify/collection-filtering-not-implemented`  | Collection | Warning  | Collection should implement filtering to avoid large response payloads. See: https://fedify.dev/manual/collections#filtering-by-server             | [handler.ts:496-504](packages/fedify/src/federation/handler.ts#L496-L504)           |
| `fedify/actor-inbox-property-required`         | Inbox      | Warning  | When inbox listeners are configured, actor must have an `inbox` property set via `Context.getInboxUri(identifier)`                                 | [builder.ts:386-391](packages/fedify/src/federation/builder.ts#L386-L391)           |
| `fedify/actor-inbox-property-mismatch`         | Inbox      | Warning  | Actor's `inbox` property must match the URI returned by `Context.getInboxUri(identifier)`                                                          | [builder.ts:392-400](packages/fedify/src/federation/builder.ts#L392-L400)           |
| `fedify/actor-shared-inbox-property-required`  | Inbox      | Warning  | When inbox listeners are configured, actor must have an `endpoints.sharedInbox` property set via `Context.getInboxUri()`                           | [builder.ts:401-406](packages/fedify/src/federation/builder.ts#L401-L406)           |
| `fedify/actor-shared-inbox-property-mismatch`  | Inbox      | Warning  | Actor's `endpoints.sharedInbox` property must match the URI returned by `Context.getInboxUri()`                                                    | [builder.ts:407-415](packages/fedify/src/federation/builder.ts#L407-L415)           |
| `fedify/actor-public-key-required`             | Keys       | Error    | When key pairs dispatcher is configured, actor must have a `publicKey` property set via `Context.getActorKeyPairs(identifier)`                     | [builder.ts:418-423](packages/fedify/src/federation/builder.ts#L418-L423)           |
| `fedify/actor-assertion-method-required`       | Keys       | Error    | When key pairs dispatcher is configured, actor must have an `assertionMethod` property set via `Context.getActorKeyPairs(identifier)`              | [builder.ts:425-431](packages/fedify/src/federation/builder.ts#L425-L431)           |
| `fedify/rsa-key-required-for-http-signature`   | Keys       | Warning  | At least one RSASSA-PKCS1-v1_5 key must be provided to sign HTTP requests                                                                          | [send.ts:216-228](packages/fedify/src/federation/send.ts#L216-L228)                 |
| `fedify/rsa-key-required-for-ld-signature`     | Keys       | Warning  | At least one RSASSA-PKCS1-v1_5 key must be provided to create Linked Data signatures                                                               | [middleware.ts:1013-1023](packages/fedify/src/federation/middleware.ts#L1013-L1023) |
| `fedify/ed25519-key-required-for-proof`        | Keys       | Warning  | At least one Ed25519 key must be provided to create Object Integrity Proofs                                                                        | [middleware.ts:1033-1043](packages/fedify/src/federation/middleware.ts#L1033-L1043) |

### Priority levels

#### High priority

These rules catch errors that directly impact ActivityPub spec compliance and
security:

- All **Actor** category rules (actor identity)
- All **Keys** category rules (cryptographic signatures)
- All **Inbox** category rules (federation message handling)

#### Medium priority

These rules ensure proper collection setup:

- All **Collection** property rules

#### Low priority

- `fedify/collection-filtering-not-implemented` (performance optimization)

### Implementation notes

1. **Static analysis limitations**: Some rules depend on runtime values and may
   require heuristic pattern matching in the AST. For example, checking if
   `actor.id` matches `context.getActorUri(identifier)` requires tracking the
   return value through the code.

2. **AST patterns to detect**:
   - Calls to `setActorDispatcher()` and analysis of the dispatcher function
     body
   - Correlation between collection dispatcher configuration and actor property
     assignments
   - Key pairs dispatcher configuration and related property assignments

3. **Auto-fix potential**: Some rules could provide auto-fix suggestions (e.g.,
   inserting missing property assignments).

Would this lint rules list address the concerns raised in this issue?
