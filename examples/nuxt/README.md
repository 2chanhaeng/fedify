<!-- deno-fmt-ignore-file -->

Nuxt example application
========================

A comprehensive example of building a federated server application using
[Fedify] with [Nuxt]. This example demonstrates how to create an
ActivityPub-compatible federated social media server that can interact with
other federated platforms like Mastodon, Pleroma, and other ActivityPub
implementations using Fedify and Nuxt.

[Fedify]: https://fedify.dev
[Nuxt]: https://nuxt.com/


Running the example
-------------------

~~~~ sh
# For pnpm (Node.js)
pnpm dev
~~~~


Communicate with other federated servers
----------------------------------------

1.  Tunnel your local server to the internet using `fedify tunnel`

    ~~~~ sh
    fedify tunnel 3000
    ~~~~

2.  Open your browser tunneled URL and check the server is running properly.

3.  Search your handle and follow from other federated servers such as Mastodon
    or Misskey.

    > [!NOTE]
    > [ActivityPub Academy] is a great resource to learn how to interact
    > with other federated servers using ActivityPub protocol.

[ActivityPub Academy]: https://www.activitypub.academy/
