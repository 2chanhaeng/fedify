import type { Note, Person } from "@fedify/vocab";

declare global {
  var keyPairsStore: Map<string, Array<CryptoKeyPair>>;
  var relationStore: Map<string, Person>;
  var postStore: PostStore;
  var sseClients: Set<(event: string, data: string) => void>;
}

class PostStore {
  #map: Map<string, Note> = new Map();
  #timeline: URL[] = [];
  constructor() {}
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
      this.#timeline = this.#timeline.filter((i) => i !== id);
    }
  }
}

export const keyPairsStore = globalThis.keyPairsStore ?? new Map();
export const relationStore = globalThis.relationStore ?? new Map();
export const postStore = globalThis.postStore ?? new PostStore();
export const sseClients = globalThis.sseClients ?? new Set();

// this is just a hack for the demo
// never do this in production, use safe and secure storage
globalThis.keyPairsStore = keyPairsStore;
globalThis.relationStore = relationStore;
globalThis.postStore = postStore;
globalThis.sseClients = sseClients;

export function broadcast(event: string, data: string): void {
  for (const send of sseClients) {
    send(event, data);
  }
}
