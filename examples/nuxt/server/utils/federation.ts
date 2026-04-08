import {
  createFederation,
  InProcessMessageQueue,
  MemoryKvStore,
} from "@fedify/fedify";
import { Person } from "@fedify/vocab";
import { getLogger } from "@logtape/logtape";

const _logger = getLogger("in-process");

const federation = createFederation({
  kv: new MemoryKvStore(),
  queue: new InProcessMessageQueue(),
});

federation.setActorDispatcher(
  "/users/{identifier}",
  (ctx, identifier) => {
    return new Person({
      id: ctx.getActorUri(identifier),
      preferredUsername: identifier,
      name: identifier,
    });
  },
);

export default federation;
