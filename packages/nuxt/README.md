`@fedify/nuxt`
==============

This package provides [Nuxt] integration for [Fedify].
Under the hood, it uses [`@fedify/h3`] as Nuxt is built on top of [H3].

[Nuxt]: https://nuxt.com/
[Fedify]: https://fedify.dev/
[`@fedify/h3`]: https://github.com/fedify-dev/fedify/tree/main/packages/h3
[H3]: https://h3.unjs.io/


Installation
------------

~~~~ bash
npm install @fedify/nuxt
~~~~


Usage
-----

Create a server route, for example `server/routes/[...fedify].ts`:

~~~~ typescript
import { federation } from "../../fedify.ts";
import { fedifyHandler } from "@fedify/nuxt";

export default fedifyHandler(federation, () => undefined);
~~~~

For detailed documentation, please refer to the Fedify documentation.
