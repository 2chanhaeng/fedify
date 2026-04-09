import { createFederation, MemoryKvStore } from "@fedify/fedify";
import { Person } from "@fedify/vocab";

const federation = createFederation<void>({
  kv: new MemoryKvStore(),
});

federation.setActorDispatcher("/users/{identifier}", (ctx, identifier) => {
  return new Person({
    id: ctx.getActorUri(identifier),
    preferredUsername: identifier,
    name: identifier,
  });
});

export default federation;
