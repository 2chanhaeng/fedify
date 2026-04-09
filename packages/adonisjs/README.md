<!-- deno-fmt-ignore-file -->

@fedify/adonisjs: Integrate Fedify with AdonisJS
===============================================

[![npm][npm badge]][npm]
[![Matrix][Matrix badge]][Matrix]
[![Follow @fedify@hollo.social][@fedify@hollo.social badge]][@fedify@hollo.social]

This package provides a simple way to integrate [Fedify] with [AdonisJS].

> [!IMPORTANT]
> This package currently supports AdonisJS 6.x.  AdonisJS 7.x requires Node.js
> 24 or later, which is not yet supported by Fedify's current integration and
> initialization workflow.

Installation
------------

::: code-group

~~~~ sh [npm]
npm add @fedify/adonisjs @fedify/fedify
~~~~

~~~~ sh [pnpm]
pnpm add @fedify/adonisjs @fedify/fedify
~~~~

~~~~ sh [Yarn]
yarn add @fedify/adonisjs @fedify/fedify
~~~~

~~~~ sh [Bun]
bun add @fedify/adonisjs @fedify/fedify
~~~~

:::

Usage
-----

The integration code looks like this:

~~~~ typescript
// --- app/middleware/fedify_middleware.ts ---
import { fedifyMiddleware } from "@fedify/adonisjs";
import federation from "#start/federation";
import "#start/logging";

export default fedifyMiddleware(federation, () => undefined);

// --- start/kernel.ts ---
import server from "@adonisjs/core/services/server";

server.use([() => import("#middleware/fedify_middleware")]);
~~~~

[npm badge]: https://img.shields.io/npm/v/@fedify/adonisjs?logo=npm
[npm]: https://www.npmjs.com/package/@fedify/adonisjs
[Matrix badge]: https://img.shields.io/matrix/fedify%3Amatrix.org
[Matrix]: https://matrix.to/#/#fedify:matrix.org
[@fedify@hollo.social badge]: https://fedi-badge.deno.dev/@fedify@hollo.social/followers.svg
[@fedify@hollo.social]: https://hollo.social/@fedify
[Fedify]: https://fedify.dev/
[AdonisJS]: https://adonisjs.com/
