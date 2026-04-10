<!-- deno-fmt-ignore-file -->

@fedify/adonis: Integrate Fedify with AdonisJS
================================================

[![JSR][JSR badge]][JSR]
[![npm][npm badge]][npm]
[![Matrix][Matrix badge]][Matrix]
[![Follow @fedify@hollo.social][@fedify@hollo.social badge]][@fedify@hollo.social]

This package provides a simple way to integrate [Fedify] with [AdonisJS].

[JSR badge]: https://jsr.io/badges/@fedify/adonis
[JSR]: https://jsr.io/@fedify/adonis
[npm badge]: https://img.shields.io/npm/v/@fedify/adonis?logo=npm
[npm]: https://www.npmjs.com/package/@fedify/adonis
[Matrix badge]: https://img.shields.io/matrix/fedify%3Amatrix.org
[Matrix]: https://matrix.to/#/#fedify:matrix.org
[@fedify@hollo.social badge]: https://fedi-badge.deno.dev/@fedify@hollo.social/followers.svg
[@fedify@hollo.social]: https://hollo.social/@fedify
[Fedify]: https://fedify.dev/
[AdonisJS]: https://adonisjs.com/


Supported versions
------------------

This package supports AdonisJS 6.x and 7.x.


Installation
------------

~~~~ bash
npm add @fedify/adonis
# or
pnpm add @fedify/adonis
# or
yarn add @fedify/adonis
# or
bun add @fedify/adonis
~~~~


Usage
-----

First, create your `Federation` instance in a server utility file,
e.g., *src/federation.ts*:

~~~~ typescript
import { createFederation, MemoryKvStore } from "@fedify/fedify";

const federation = createFederation({
  kv: new MemoryKvStore(),
});

// ... configure your federation ...

export default federation;
~~~~

Then, register the Fedify middleware as a server-level middleware in your
AdonisJS application.  Create a middleware file, e.g.,
*app/middleware/fedify_middleware.ts*:

~~~~ typescript
import { fedifyMiddleware } from "@fedify/adonis";
import federation from "#start/federation";

export default fedifyMiddleware(federation);
~~~~

Finally, register the middleware in your *start/kernel.ts*:

~~~~ typescript
import server from "@adonisjs/core/services/server";

server.use([
  () => import("#middleware/fedify_middleware"),
]);
~~~~
