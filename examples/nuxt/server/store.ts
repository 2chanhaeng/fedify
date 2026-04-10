import type { Note, Person } from "@fedify/vocab";

declare global {
  // eslint-disable-next-line no-var
  var keyPairsStore: Map<string, Array<CryptoKeyPair>>;
  // eslint-disable-next-line no-var
  var relationStore: Map<string, Person>;
  // eslint-disable-next-line no-var
  var postStore: PostStore;
}

class PostStore {
  #map: Map<string, Note> = new Map();
  #timeline: URL[] = [];

  append(posts: Note[]): void {
    for (const post of posts) {
      if (post.id == null) continue;
      if (this.#map.has(post.id.toString())) continue;
      this.#map.set(post.id.toString(), post);
      this.#timeline.push(post.id);
    }
  }

  get(id: URL): Note | undefined {
    return this.#map.get(id.toString());
  }

  getAll(): Note[] {
    return this.#timeline
      .toReversed()
      .map((id) => this.#map.get(id.toString()))
      .filter((p): p is Note => p != null);
  }

  delete(id: URL): void {
    if (this.#map.delete(id.toString())) {
      this.#timeline = this.#timeline.filter((i) => i.href !== id.href);
    }
  }
}

// Stash the stores on `globalThis` so that hot-reloads in `nuxt dev` reuse the
// same instances.  This is a demo-only hack — never persist secrets like
// private keys in process memory in production.
export const keyPairsStore: Map<string, Array<CryptoKeyPair>> =
  globalThis.keyPairsStore ?? new Map();
export const relationStore: Map<string, Person> = globalThis.relationStore ??
  new Map();
export const postStore: PostStore = globalThis.postStore ?? new PostStore();

globalThis.keyPairsStore = keyPairsStore;
globalThis.relationStore = relationStore;
globalThis.postStore = postStore;
