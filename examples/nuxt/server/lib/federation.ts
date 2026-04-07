import {
  createFederation,
  generateCryptoKeyPair,
  InProcessMessageQueue,
  MemoryKvStore,
} from "@fedify/fedify";
import {
  Accept,
  Endpoints,
  Follow,
  Image,
  Note,
  Person,
  type Recipient,
  Undo,
} from "@fedify/vocab";
import { keyPairsStore, relationStore } from "./store";

const IDENTIFIER = "demo";

const federation = createFederation<void>({
  kv: new MemoryKvStore(),
  queue: new InProcessMessageQueue(),
});

federation.setNodeInfoDispatcher("/nodeinfo/2.1", (_ctx) => {
  return {
    software: {
      name: "fedify-nuxt",
      version: "0.0.1",
    },
    protocols: ["activitypub"],
    usage: {
      users: { total: 1, activeHalfyear: 1, activeMonth: 1 },
      localPosts: 0,
    },
  };
});

federation
  .setActorDispatcher("/users/{identifier}", async (ctx, identifier) => {
    if (identifier !== IDENTIFIER) {
      return null;
    }
    const keyPairs = await ctx.getActorKeyPairs(identifier);
    return new Person({
      id: ctx.getActorUri(identifier),
      name: "Fedify Demo",
      summary: "This is a Fedify Demo account.",
      preferredUsername: identifier,
      icon: new Image({ url: new URL("/demo-profile.png", ctx.url) }),
      url: new URL("/", ctx.url),
      inbox: ctx.getInboxUri(identifier),
      followers: ctx.getFollowersUri(identifier),
      endpoints: new Endpoints({ sharedInbox: ctx.getInboxUri() }),
      publicKey: keyPairs[0].cryptographicKey,
      assertionMethods: keyPairs.map((keyPair) => keyPair.multikey),
    });
  })
  .setKeyPairsDispatcher(async (_, identifier) => {
    if (identifier !== IDENTIFIER) {
      return [];
    }
    const existing = keyPairsStore.get(identifier);
    if (existing) {
      return existing;
    }
    const { privateKey, publicKey } = await generateCryptoKeyPair(
      "Ed25519",
    );
    keyPairsStore.set(identifier, [{ privateKey, publicKey }]);
    return [{ privateKey, publicKey }];
  });

federation
  .setInboxListeners("/users/{identifier}/inbox", "/inbox")
  .on(Follow, async (ctx, follow) => {
    if (
      follow.id == null || follow.actorId == null || follow.objectId == null
    ) {
      return;
    }
    const result = ctx.parseUri(follow.objectId);
    if (result?.type !== "actor" || result.identifier !== IDENTIFIER) {
      return;
    }
    const follower = (await follow.getActor(ctx)) as Person;
    if (!follower?.id || follower.id === null) {
      throw new Error("Follower is null");
    }
    await ctx.sendActivity(
      { identifier: result.identifier },
      follower,
      new Accept({
        id: new URL(
          `#accepts/${follower.id.href}`,
          ctx.getActorUri(IDENTIFIER),
        ),
        actor: follow.objectId,
        object: follow,
      }),
    );
    relationStore.set(follower.id.href, follower);
  })
  .on(Undo, async (ctx, undo) => {
    const activity = await undo.getObject(ctx);
    if (activity instanceof Follow) {
      if (activity.id == null || undo.actorId == null) {
        return;
      }
      relationStore.delete(undo.actorId.href);
    } else {
      console.debug(undo);
    }
  });

federation.setObjectDispatcher(
  Note,
  "/users/{identifier}/posts/{id}",
  (ctx, values) => {
    const id = ctx.getObjectUri(Note, values);
    return new Note({
      id,
      attribution: ctx.getActorUri(values.identifier),
      content: values.id,
    });
  },
);

federation.setFollowersDispatcher(
  "/users/{identifier}/followers",
  () => {
    const followers = Array.from(relationStore.values());
    const items: Recipient[] = followers.map((f) => ({
      id: f.id,
      inboxId: f.inboxId,
      endpoints: f.endpoints,
    }));
    return { items };
  },
);

export default federation;
