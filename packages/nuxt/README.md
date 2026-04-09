<!-- deno-fmt-ignore-file -->

@fedify/nuxt: Integrate Fedify with Nuxt
=========================================

[![JSR][JSR badge]][JSR]
[![npm][npm badge]][npm]
[![Matrix][Matrix badge]][Matrix]
[![Follow @fedify@hollo.social][@fedify@hollo.social badge]][@fedify@hollo.social]

This package provides a simple way to integrate [Fedify] with [Nuxt],
a full-stack web framework built on [Vue.js].  Since Nuxt uses [Nitro]
and [h3] under the hood, this package leverages h3's event system for
request handling through Nuxt's server middleware.

The integration code looks like this:

~~~~ typescript
// server/middleware/federation.ts
import { fedifyMiddleware } from "@fedify/nuxt";
import federation from "../utils/federation";

export default fedifyMiddleware(
  federation,
  (event, request) => "context data goes here"
);
~~~~

~~~~ typescript
// server/error.ts
import { onError } from "@fedify/nuxt";

export default onError;
~~~~

~~~~ typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    errorHandler: "~/server/error",
  },
});
~~~~

> [!NOTE]
> Your app has to configure `nitro.errorHandler` in *nuxt.config.ts* to let
> Fedify negotiate content types.  If you don't do this, Fedify will not be
> able to respond with a proper error status code when a content negotiation
> fails.

[JSR badge]: https://jsr.io/badges/@fedify/nuxt
[JSR]: https://jsr.io/@fedify/nuxt
[npm badge]: https://img.shields.io/npm/v/@fedify/nuxt?logo=npm
[npm]: https://www.npmjs.com/package/@fedify/nuxt
[Matrix badge]: https://img.shields.io/matrix/fedify%3Amatrix.org
[Matrix]: https://matrix.to/#/#fedify:matrix.org
[@fedify@hollo.social badge]: https://fedi-badge.deno.dev/@fedify@hollo.social/followers.svg
[@fedify@hollo.social]: https://hollo.social/@fedify
[Fedify]: https://fedify.dev/
[Nuxt]: https://nuxt.com/
[Vue.js]: https://vuejs.org/
[Nitro]: https://nitro.build/
[h3]: https://h3.unjs.io/


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

First, create your `Federation` instance in a server utility file,
e.g., *server/utils/federation.ts*:

~~~~ typescript
import { createFederation, MemoryKvStore } from "@fedify/fedify";

const federation = createFederation({
  kv: new MemoryKvStore(),
});

// ... configure your federation ...

export default federation;
~~~~

Then, create a server middleware file at *server/middleware/federation.ts*:

~~~~ typescript
import { fedifyMiddleware } from "@fedify/nuxt";
import federation from "../utils/federation";

export default fedifyMiddleware(federation, (event, request) => undefined);
~~~~

Next, create an error handler at *server/error.ts*:

~~~~ typescript
import { onError } from "@fedify/nuxt";

export default onError;
~~~~

Finally, configure the error handler in *nuxt.config.ts*:

~~~~ typescript
export default defineNuxtConfig({
  nitro: {
    errorHandler: "~/server/error",
  },
});
~~~~
