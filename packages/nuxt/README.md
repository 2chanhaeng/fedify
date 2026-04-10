<!-- deno-fmt-ignore-file -->

@fedify/nuxt: Integrate Fedify with Nuxt
========================================

[![npm][npm badge]][npm]
[![Matrix][Matrix badge]][Matrix]
[![Follow @fedify@hollo.social][@fedify@hollo.social badge]][@fedify@hollo.social]

This package provides a [Nuxt] module and server middleware helpers for
integrating [Fedify] with a Nuxt application.

Because Nuxt is built on top of [Nitro] and [h3], the actual federation
middleware is provided by `@fedify/h3` and re-exported from this package
for convenience.  In addition, `@fedify/nuxt` ships a Nuxt module that
auto-configures Nitro and Vite for Fedify compatibility.

Supported Nuxt versions: **Nuxt 3** and **Nuxt 4**.

[npm badge]: https://img.shields.io/npm/v/@fedify/nuxt?logo=npm
[npm]: https://www.npmjs.com/package/@fedify/nuxt
[Matrix badge]: https://img.shields.io/matrix/fedify%3Amatrix.org
[Matrix]: https://matrix.to/#/#fedify:matrix.org
[@fedify@hollo.social badge]: https://fedi-badge.deno.dev/@fedify@hollo.social/followers.svg
[@fedify@hollo.social]: https://hollo.social/@fedify
[Nuxt]: https://nuxt.com/
[Fedify]: https://fedify.dev/
[Nitro]: https://nitro.build/
[h3]: https://h3.dev/


Installation
------------

~~~~ bash
npm  add @fedify/nuxt @fedify/fedify
# or
pnpm add @fedify/nuxt @fedify/fedify
# or
yarn add @fedify/nuxt @fedify/fedify
# or
bun  add @fedify/nuxt @fedify/fedify
~~~~


Usage
-----

### 1.  register the Nuxt module

Add `fedifyModule` to the `modules` array in your *nuxt.config.ts*:

~~~~ typescript
import fedifyModule from "@fedify/nuxt";

export default defineNuxtConfig({
  modules: [fedifyModule],
  nitro: {
    errorHandler: "~~/server/error",
  },
});
~~~~

The module performs two adjustments:

1.  Sets `nitro.esbuild.options.target` to `"esnext"` so that modern
    JavaScript syntax used by `@fedify/fedify` is preserved.
2.  Adds `@fedify/fedify` and `@fedify/vocab` to `vite.ssr.noExternal`
    so that Vite bundles them for SSR rather than treating them as
    external modules.

### 2.  create your `Federation` instance

Create a *server/federation.ts* file that exports a configured
`Federation` instance:

~~~~ typescript
import { createFederation, MemoryKvStore } from "@fedify/fedify";

const federation = createFederation<void>({
  kv: new MemoryKvStore(),
});

// ... configure dispatchers, listeners, etc. ...

export default federation;
~~~~

### 3.  add the federation middleware

Create a *server/middleware/federation.ts* file:

~~~~ typescript
import { integrateFederation } from "@fedify/nuxt";
import federation from "../federation";

export default integrateFederation(
  federation,
  (event, request) => undefined,
);
~~~~

### 4.  add the error handler

Create a *server/error.ts* file so that 406 Not Acceptable responses
from Fedify are surfaced when no Nuxt route handles the URL:

~~~~ typescript
import { onError } from "@fedify/nuxt";

export default onError;
~~~~

This file is referenced by `nitro.errorHandler` in *nuxt.config.ts*
above.  Whenever Fedify and a Nuxt page share the same path, the
`Accept` header decides which side handles the request.


Exports
-------

 -  `fedifyModule` (default export) — the Nuxt module described above.
 -  `integrateFederation()` — re-export of `@fedify/h3`'s function for
    use in *server/middleware/* files.
 -  `onError()` — re-export of `@fedify/h3`'s error handler for use in
    *server/error.ts*.
 -  `ContextDataFactory<TContextData>` — re-exported type for typing
    the context data factory passed to `integrateFederation()`.
