import {
  createFederation,
  generateCryptoKeyPair,
  MemoryKvStore,
} from "@fedify/fedify";
import { Accept, Endpoints, Follow, Person } from "@fedify/vocab";

const federation = createFederation<void>({
  kv: new MemoryKvStore(),
});

const keyPairs = new Map<
  string,
  Awaited<ReturnType<typeof generateCryptoKeyPair>>
>();

federation.setNodeInfoDispatcher("/nodeinfo/2.1", () => ({
  software: {
    name: "fedify-nuxt",
    version: "0.0.1",
  },
  protocols: ["activitypub"],
  usage: {
    users: { total: 1, activeHalfyear: 1, activeMonth: 1 },
    localPosts: 0,
    localComments: 0,
  },
}));

federation
  .setActorDispatcher("/users/{identifier}", async (context, identifier) => {
    if (identifier !== "demo") {
      return null;
    }
    const actorKeyPairs = await context.getActorKeyPairs(identifier);
    return new Person({
      id: context.getActorUri(identifier),
      name: "Fedify Demo",
      summary: "This is a Fedify Demo account on Nuxt.",
      preferredUsername: identifier,
      url: new URL(`/users/${identifier}`, context.url),
      inbox: context.getInboxUri(identifier),
      endpoints: new Endpoints({ sharedInbox: context.getInboxUri() }),
      publicKey: actorKeyPairs[0].cryptographicKey,
      assertionMethods: actorKeyPairs.map((keyPair) => keyPair.multikey),
    });
  })
  .setKeyPairsDispatcher(async (_context, identifier) => {
    if (identifier !== "demo") {
      return [];
    }
    const existing = keyPairs.get(identifier);
    if (existing != null) {
      return [existing];
    }
    const created = await generateCryptoKeyPair();
    keyPairs.set(identifier, created);
    return [created];
  });

federation
  .setInboxListeners("/users/{identifier}/inbox", "/inbox")
  .on(Follow, async (context, follow) => {
    if (
      follow.id == null ||
      follow.actorId == null ||
      follow.objectId == null
    ) {
      return;
    }
    const result = context.parseUri(follow.objectId);
    if (result?.type !== "actor" || result.identifier !== "demo") {
      return;
    }
    const follower = await follow.getActor(context);
    if (follower?.id == null) {
      throw new Error("follower is null");
    }
    await context.sendActivity(
      { identifier: result.identifier },
      follower,
      new Accept({
        id: new URL(
          `#accepts/${follower.id.href}`,
          context.getActorUri("demo"),
        ),
        actor: follow.objectId,
        object: follow,
      }),
    );
  });

export default federation;
