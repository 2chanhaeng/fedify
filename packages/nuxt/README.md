<!-- deno-fmt-ignore-file -->

@fedify/nuxt: Integrate Fedify with Nuxt
=========================================

[![JSR][JSR badge]][JSR]
[![npm][npm badge]][npm]
[![Matrix][Matrix badge]][Matrix]
[![Follow @fedify@hollo.social][@fedify@hollo.social badge]][@fedify@hollo.social]

This package provides a simple way to integrate [Fedify] with [Nuxt].

The integration uses Nuxt's server middleware system.  First, install the
package:

~~~~ sh
npm add @fedify/nuxt
~~~~

Then, create a server middleware file at *server/middleware/federation.ts*:

~~~~ typescript
import { fedifyMiddleware } from "@fedify/nuxt";
import { federation } from "~/server/lib/federation";  // Your `Federation` instance

export default fedifyMiddleware(
  federation,
  (event) => "context data goes here",
);
~~~~

Next, create an error handler at *server/error.ts*:

~~~~ typescript
export { onError as default } from "@fedify/nuxt";
~~~~

Finally, configure the Nitro error handler in *nuxt.config.ts*:

~~~~ typescript
export default defineNuxtConfig({
  nitro: {
    errorHandler: "~/server/error",
  },
});
~~~~

> [!NOTE]
> Configuring `nitro.errorHandler` is required for Fedify to properly handle
> content negotiation.  Without it, Fedify will not be able to respond with a
> 406 Not Acceptable status code when a content negotiation fails.

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
