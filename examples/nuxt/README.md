<!-- deno-fmt-ignore-file -->

Nuxt example application
========================

A minimal example of building a federated server application using
[Fedify] with [Nuxt] via [@fedify/nuxt].  It demonstrates how to register
the Fedify Nuxt module, wire up a server middleware, and serve an
ActivityPub actor at `/users/demo` so that other fediverse servers
(Mastodon, Pleroma, Misskey, …) can interact with it.

[Fedify]: https://fedify.dev/
[Nuxt]: https://nuxt.com/
[@fedify/nuxt]: ../../packages/nuxt/


Running the example
-------------------

~~~~ sh
pnpm install
pnpm dev
~~~~

The dev server starts on <http://localhost:3000>.  The home page is
served by Nuxt; requests with an ActivityPub `Accept` header
(`application/activity+json`, etc.) are handled by Fedify instead.


Communicate with other federated servers
----------------------------------------

1.  Tunnel your local server to the internet using `fedify tunnel`:

    ~~~~ sh
    fedify tunnel 3000
    ~~~~

2.  Open the tunnel URL in your browser to confirm the server is running.

3.  From another federated server (Mastodon, Misskey, …), search for
    `@demo@<tunnel-host>` and follow it.

    > [!NOTE]
    > [ActivityPub Academy] is a great resource for learning how to interact
    > with ActivityPub-based servers.

[ActivityPub Academy]: https://www.activitypub.academy/
