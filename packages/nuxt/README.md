<!-- deno-fmt-ignore-file -->

@fedify/Nuxt: Integrate Fedify with Nuxt
========================================

[![npm][npm badge]][npm]
[![Matrix][Matrix badge]][Matrix]
[![Follow @fedify@hollo.social][@fedify@hollo.social badge]][@fedify@hollo.social]

This package provides a simple way to integrate [Fedify] with [Nuxt].
It includes a Nuxt module for Vite SSR configuration and server middleware
for handling ActivityPub federation requests.

[npm badge]: https://img.shields.io/npm/v/@fedify/nuxt?logo=npm
[npm]: https://www.npmjs.com/package/@fedify/nuxt
[Matrix badge]: https://img.shields.io/matrix/fedify%3Amatrix.org
[Matrix]: https://matrix.to/#/#fedify:matrix.org
[@fedify@hollo.social badge]: https://fedi-badge.deno.dev/@fedify@hollo.social/followers.svg
[@fedify@hollo.social]: https://hollo.social/@fedify
[Fedify]: https://fedify.dev/
[Nuxt]: https://nuxt.com/


Installation
------------

~~~~ bash
npm add @fedify/nuxt
# or
pnpm add @fedify/nuxt
# or
yarn add @fedify/nuxt
# or
bun add @fedify/nuxt
~~~~


Usage
-----

First, add the Fedify module to your *nuxt.config.ts* and configure the
Nitro error handler:

~~~~ typescript
import fedifyModule from "@fedify/nuxt";

export default defineNuxtConfig({
  modules: [fedifyModule],
  nitro: {
    errorHandler: "~~/server/error",
    esbuild: {
      options: {
        target: "esnext",
      },
    },
  },
});
~~~~

Create the error handler in *server/error.ts*:

~~~~ typescript
import { onError } from "@fedify/nuxt";

export default onError;
~~~~

Create your `Federation` instance in a server file,
e.g., *server/federation.ts*:

~~~~ typescript
import { createFederation, MemoryKvStore } from "@fedify/fedify";

const federation = createFederation({
  kv: new MemoryKvStore(),
});

// ... configure your federation ...

export default federation;
~~~~

Then, create a server middleware in *server/middleware/federation.ts*:

~~~~ typescript
import { fedifyMiddleware } from "@fedify/nuxt";
import federation from "../federation";

export default fedifyMiddleware(
  federation,
  (event, request) => undefined,
);
~~~~
