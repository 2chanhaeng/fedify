<!-- deno-fmt-ignore-file -->

@fedify/Nuxt: Integrate Fedify with Nuxt
========================================

[![npm][npm badge]][npm]
[![Matrix][Matrix badge]][Matrix]
[![Follow @fedify@hollo.social][@fedify@hollo.social badge]][@fedify@hollo.social]

This package provides a Nuxt module that integrates [Fedify] with [Nuxt].
It registers Fedify as Nitro server middleware so your Nuxt pages and
ActivityPub endpoints can share the same routes through content negotiation.

[npm badge]: https://img.shields.io/npm/v/@fedify/nuxt?logo=npm
[npm]: https://www.npmjs.com/package/@fedify/nuxt
[Matrix badge]: https://img.shields.io/matrix/fedify%3Amatrix.org
[Matrix]: https://matrix.to/#/#fedify:matrix.org
[@fedify@hollo.social badge]: https://fedi-badge.deno.dev/@fedify@hollo.social/followers.svg
[@fedify@hollo.social]: https://hollo.social/@fedify
[Fedify]: https://fedify.dev/
[Nuxt]: https://nuxt.com/


Supported Nuxt versions
-----------------------

This package supports Nuxt 3.x and 4.x.


Installation
------------

~~~~ bash
npm add @fedify/nuxt @fedify/fedify
# or
pnpm add @fedify/nuxt @fedify/fedify
# or
yarn add @fedify/nuxt @fedify/fedify
# or
bun add @fedify/nuxt @fedify/fedify
~~~~


Usage
-----

First, create your `Federation` instance in *server/federation.ts*:

~~~~ typescript
import { createFederation, MemoryKvStore } from "@fedify/fedify";

const federation = createFederation({
  kv: new MemoryKvStore(),
});

federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => ({
  id: ctx.getActorUri(identifier),
  preferredUsername: identifier,
}));

export default federation;
~~~~

Then, register the module in *nuxt.config.ts*:

~~~~ typescript
export default defineNuxtConfig({
  modules: ["@fedify/nuxt"],
  fedify: {
    federation: "~~/server/federation",
  },
});
~~~~

If you need request-scoped context data, create a file such as
*server/fedify-context.ts* and point the module to it:

~~~~ typescript
// server/fedify-context.ts
import type { ContextDataFactory } from "@fedify/nuxt";

const createContextData: ContextDataFactory<{ ip: string | null }> = (event) => ({
  ip: event.node.req.socket.remoteAddress ?? null,
});

export default createContextData;
~~~~

~~~~ typescript
export default defineNuxtConfig({
  modules: ["@fedify/nuxt"],
  fedify: {
    federation: "~~/server/federation",
    contextDataFactory: "~~/server/fedify-context",
  },
});
~~~~
