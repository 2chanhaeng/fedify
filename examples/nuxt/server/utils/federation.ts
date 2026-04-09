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
  PUBLIC_COLLECTION,
  type Recipient,
  Undo,
} from "@fedify/vocab";

const federation = createFederation<void>({
  kv: new MemoryKvStore(),
  queue: new InProcessMessageQueue(),
});

const IDENTIFIER = "demo";

federation
  .setActorDispatcher(
    "/users/{identifier}",
    async (context, identifier) => {
      if (identifier != IDENTIFIER) {
        return null;
      }
      const keyPairs = await context.getActorKeyPairs(identifier);
      return new Person({
        id: context.getActorUri(identifier),
        name: "Fedify Demo",
        summary: "This is a Fedify Demo account.",
        preferredUsername: identifier,
        icon: new Image({ url: new URL("/demo-profile.png", context.url) }),
        url: new URL("/", context.url),
        inbox: context.getInboxUri(identifier),
        endpoints: new Endpoints({ sharedInbox: context.getInboxUri() }),
        publicKey: keyPairs[0].cryptographicKey,
        assertionMethods: keyPairs.map((keyPair) => keyPair.multikey),
      });
    },
  )
  .setKeyPairsDispatcher(async (_, identifier) => {
    if (identifier != IDENTIFIER) {
      return [];
    }
    const keyPairs = keyPairsStore.get(identifier);
    if (keyPairs) {
      return keyPairs;
    }
    const { privateKey, publicKey } = await generateCryptoKeyPair();
    keyPairsStore.set(identifier, [{ privateKey, publicKey }]);
    return [{ privateKey, publicKey }];
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
    if (result?.type !== "actor" || result.identifier !== IDENTIFIER) {
      return;
    }
    const follower = await follow.getActor(context) as Person;
    if (!follower?.id || follower.id === null) {
      throw new Error("follower is null");
    }
    await context.sendActivity(
      { identifier: result.identifier },
      follower,
      new Accept({
        id: new URL(
          `#accepts/${follower.id.href}`,
          context.getActorUri(IDENTIFIER),
        ),
        actor: follow.objectId,
        object: follow,
      }),
    );
    relationStore.set(follower.id.href, follower);
  })
  .on(Undo, async (context, undo) => {
    const activity = await undo.getObject(context);
    if (activity instanceof Follow) {
      if (activity.id == null) {
        return;
      }
      if (undo.actorId == null) {
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
    const post = postStore.get(id);
    if (post == null) return null;
    return new Note({
      id,
      attribution: ctx.getActorUri(values.identifier),
      to: PUBLIC_COLLECTION,
      cc: ctx.getFollowersUri(values.identifier),
      content: post.content,
      mediaType: "text/html",
      published: post.published,
      url: id,
    });
  },
);

federation
  .setFollowersDispatcher(
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

federation.setNodeInfoDispatcher("/nodeinfo/2.1", (ctx) => {
  return {
    software: {
      name: "fedify-nuxt",
      version: "0.0.1",
      homepage: new URL(ctx.canonicalOrigin),
    },
    protocols: ["activitypub"],
    usage: {
      users: { total: 1, activeHalfyear: 1, activeMonth: 1 },
      localPosts: postStore.getAll().length,
    },
  };
});

export default federation;

// In-memory stores (for demo purposes only)
declare global {
  var keyPairsStore: Map<string, Array<CryptoKeyPair>>;
  var relationStore: Map<string, Person>;
  var postStore: PostStore;
}

class PostStore {
  #map: Map<string, Note> = new Map();
  #timeline: URL[] = [];
  append(posts: Note[]) {
    posts.filter((p) => p.id && !this.#map.has(p.id.toString()))
      .forEach((p) => {
        this.#map.set(p.id!.toString(), p);
        this.#timeline.push(p.id!);
      });
  }
  get(id: URL) {
    return this.#map.get(id.toString());
  }
  getAll() {
    return this.#timeline.toReversed()
      .map((id) => id.toString())
      .map((id) => this.#map.get(id)!)
      .filter((p) => p);
  }
  delete(id: URL) {
    const existed = this.#map.delete(id.toString());
    if (existed) {
      this.#timeline = this.#timeline.filter((i) => i.href !== id.href);
    }
  }
}

const keyPairsStore = globalThis.keyPairsStore ?? new Map();
const relationStore = globalThis.relationStore ?? new Map();
const postStore = globalThis.postStore ?? new PostStore();

globalThis.keyPairsStore = keyPairsStore;
globalThis.relationStore = relationStore;
globalThis.postStore = postStore;
