import { assertEquals } from "@std/assert";
import type {
  ActorDispatcher,
  ActorHandleMapper,
} from "../federation/callback.ts";
import type { RequestContext } from "../federation/context.ts";
import { createRequestContext } from "../testing/context.ts";
import { test } from "../testing/mod.ts";
import type { Actor } from "../vocab/actor.ts";
import { Image, Link, Person } from "../vocab/vocab.ts";
import { handleWebFinger } from "./handler.ts";

test("handleWebFinger()", async () => {
  const url = new URL("https://example.com/.well-known/webfinger");
  const context = createRequestContext<void>({
    url,
    data: undefined,
    getActorUri(identifier) {
      return new URL(`https://example.com/users/${identifier}`);
    },
    async getActor(handle): Promise<Actor | null> {
      return await actorDispatcher(
        context,
        handle,
      );
    },
    parseUri(uri) {
      if (uri == null) return null;
      if (uri.protocol === "acct:") return null;
      const paths = uri.pathname.split("/");
      const identifier = paths[paths.length - 1];
      return {
        type: "actor",
        identifier,
        get handle(): string {
          throw new Error("ParseUriResult.handle is deprecated!");
        },
      };
    },
  });
  const actorDispatcher: ActorDispatcher<void> = (ctx, handle) => {
    if (handle !== "someone" && handle !== "someone2") return null;
    return new Person({
      id: ctx.getActorUri(handle),
      name: handle === "someone" ? "Someone" : "Someone 2",
      preferredUsername: handle === "someone" ? null : handle,
      icon: new Image({
        url: new URL("https://example.com/icon.jpg"),
        mediaType: "image/jpeg",
      }),
      urls: [
        new URL("https://example.com/@" + handle),
        new Link({
          href: new URL("https://example.org/@" + handle),
          rel: "alternate",
          mediaType: "text/html",
        }),
      ],
    });
  };
  let onNotFoundCalled: Request | null = null;
  const onNotFound = (request: Request) => {
    onNotFoundCalled = request;
    return new Response("Not found", { status: 404 });
  };

  let request = context.request;
  let response = await handleWebFinger(request, {
    context,
    onNotFound,
  });
  assertEquals(response.status, 404);
  assertEquals(onNotFoundCalled, request);

  onNotFoundCalled = null;
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    onNotFound,
  });
  assertEquals(response.status, 400);
  assertEquals(await response.text(), "Missing resource parameter.");
  assertEquals(onNotFoundCalled, null);

  url.searchParams.set("resource", " invalid ");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    onNotFound,
  });
  assertEquals(response.status, 400);
  assertEquals(await response.text(), "Invalid resource URL.");
  assertEquals(onNotFoundCalled, null);

  url.searchParams.set("resource", "acct:someone@example.com");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    onNotFound,
  });
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "application/jrd+json");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  const expected = {
    subject: "acct:someone@example.com",
    aliases: [
      "https://example.com/users/someone",
    ],
    links: [
      {
        href: "https://example.com/users/someone",
        rel: "self",
        type: "application/activity+json",
      },
      {
        href: "https://example.com/@someone",
        rel: "http://webfinger.net/rel/profile-page",
      },
      {
        href: "https://example.org/@someone",
        rel: "alternate",
        type: "text/html",
      },
      {
        href: "https://example.com/icon.jpg",
        rel: "http://webfinger.net/rel/avatar",
        type: "image/jpeg",
      },
    ],
  };
  assertEquals(await response.json(), expected);

  url.searchParams.set("resource", "https://example.com/users/someone");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    onNotFound,
  });
  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    ...expected,
    aliases: [],
    subject: "https://example.com/users/someone",
  });

  url.searchParams.set("resource", "https://example.com/users/someone2");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    onNotFound,
  });
  assertEquals(response.status, 200);
  const expected2 = {
    subject: "https://example.com/users/someone2",
    aliases: [
      "acct:someone2@example.com",
    ],
    links: [
      {
        href: "https://example.com/users/someone2",
        rel: "self",
        type: "application/activity+json",
      },
      {
        href: "https://example.com/@someone2",
        rel: "http://webfinger.net/rel/profile-page",
      },
      {
        href: "https://example.org/@someone2",
        rel: "alternate",
        type: "text/html",
      },
      {
        href: "https://example.com/icon.jpg",
        rel: "http://webfinger.net/rel/avatar",
        type: "image/jpeg",
      },
    ],
  };
  assertEquals(await response.json(), expected2);

  url.searchParams.set("resource", "acct:no-one@example.com");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    onNotFound,
  });
  assertEquals(response.status, 404);
  assertEquals(onNotFoundCalled, request);

  onNotFoundCalled = null;
  url.searchParams.set("resource", "https://example.com/users/no-one");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    onNotFound,
  });
  assertEquals(response.status, 404);
  assertEquals(onNotFoundCalled, request);

  onNotFoundCalled = null;
  url.searchParams.set("resource", "https://google.com/");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    onNotFound,
  });
  assertEquals(response.status, 404);
  assertEquals(onNotFoundCalled, request);

  const actorHandleMapper: ActorHandleMapper<void> = (_ctx, username) => {
    return username === "foo"
      ? "someone"
      : username === "bar"
      ? "someone2"
      : null;
  };
  url.searchParams.set("resource", "acct:foo@example.com");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    actorHandleMapper,
    onNotFound,
  });
  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    ...expected,
    aliases: ["https://example.com/users/someone"],
    subject: "acct:foo@example.com",
  });

  url.searchParams.set("resource", "acct:bar@example.com");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    actorHandleMapper,
    onNotFound,
  });
  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    ...expected2,
    aliases: ["https://example.com/users/someone2"],
    subject: "acct:bar@example.com",
  });

  url.searchParams.set("resource", "https://example.com/users/someone");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    actorHandleMapper,
    onNotFound,
  });
  assertEquals(response.status, 200);
  assertEquals(await response.json(), {
    ...expected,
    aliases: [],
    subject: "https://example.com/users/someone",
  });

  url.searchParams.set("resource", "acct:baz@example.com");
  request = new Request(url);
  response = await handleWebFinger(request, {
    context,
    actorDispatcher,
    actorHandleMapper,
    onNotFound,
  });
  assertEquals(response.status, 404);
});

test("handleWebFinger() with port", async (t) => {
  function createContext(url: URL): RequestContext<void> {
    const context = createRequestContext<void>({
      url,
      data: undefined,
      getActorUri(identifier) {
        return new URL(`${url.origin}/users/${identifier}`);
      },
      async getActor(handle): Promise<Actor | null> {
        return await actorDispatcher(
          context,
          handle,
        );
      },
      parseUri(uri) {
        if (uri == null) return null;
        if (uri.protocol === "acct:") return null;
        if (!uri.pathname.startsWith("/users/")) return null;
        const paths = uri.pathname.split("/");
        const identifier = paths[paths.length - 1];
        return {
          type: "actor",
          identifier,
          get handle(): string {
            throw new Error("ParseUriResult.handle is deprecated!");
          },
        };
      },
    });
    return context;
  }

  const actorDispatcher: ActorDispatcher<void> = (ctx, identifier) => {
    if (identifier !== "someone" && identifier !== "someone2") return null;
    const actorUri = ctx.getActorUri(identifier);
    return new Person({
      id: actorUri,
      name: identifier === "someone" ? "Someone" : "Someone 2",
      preferredUsername: identifier === "someone"
        ? null
        : identifier === "someone2"
        ? "bar"
        : null,
      icon: new Image({
        url: new URL(`${actorUri.origin}/icon.jpg`),
        mediaType: "image/jpeg",
      }),
      urls: [
        new URL(`${actorUri.origin}/@${identifier}`),
        new Link({
          href: new URL(`${actorUri.origin}/@${identifier}`),
          rel: "alternate",
          mediaType: "text/html",
        }),
      ],
    });
  };

  const onNotFound = () => {
    return new Response("Not found", { status: 404 });
  };

  const expectedForLocalhostWithPort = {
    subject: "acct:someone@localhost:8000",
    aliases: ["https://localhost:8000/users/someone"],
    links: [
      {
        href: "https://localhost:8000/users/someone",
        rel: "self",
        type: "application/activity+json",
      },
      {
        href: "https://localhost:8000/@someone",
        rel: "http://webfinger.net/rel/profile-page",
      },
      {
        href: "https://localhost:8000/@someone",
        rel: "alternate",
        type: "text/html",
      },
      {
        href: "https://localhost:8000/icon.jpg",
        rel: "http://webfinger.net/rel/avatar",
        type: "image/jpeg",
      },
    ],
  };

  await t.step("on localhost with port, ok: resource=acct:...", async () => {
    const u = new URL("https://localhost:8000/.well-known/webfinger");
    u.searchParams.set("resource", "acct:someone@localhost:8000");
    const context = createContext(u);
    const request = context.request;
    const response = await handleWebFinger(request, {
      context,
      actorDispatcher,
      onNotFound,
    });
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Content-Type"), "application/jrd+json");
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(await response.json(), expectedForLocalhostWithPort);
  });

  const expectedForHostnameWithPort = {
    subject: "acct:someone@example.com:8000",
    aliases: ["http://example.com:8000/users/someone"],
    links: [
      {
        href: "http://example.com:8000/users/someone",
        rel: "self",
        type: "application/activity+json",
      },
      {
        href: "http://example.com:8000/@someone",
        rel: "http://webfinger.net/rel/profile-page",
      },
      {
        href: "http://example.com:8000/@someone",
        rel: "alternate",
        type: "text/html",
      },
      {
        href: "http://example.com:8000/icon.jpg",
        rel: "http://webfinger.net/rel/avatar",
        type: "image/jpeg",
      },
    ],
  };

  await t.step("on hostname with port, ok: resource=acct:...", async () => {
    const u = new URL("http://example.com:8000/.well-known/webfinger");
    u.searchParams.set("resource", "acct:someone@example.com:8000");
    const context = createContext(u);
    const request = context.request;
    const response = await handleWebFinger(request, {
      context,
      actorDispatcher,
      onNotFound,
    });
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Content-Type"), "application/jrd+json");
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(await response.json(), expectedForHostnameWithPort);
  });
});
