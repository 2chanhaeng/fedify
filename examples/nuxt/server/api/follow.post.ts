import { Follow } from "@fedify/vocab";
import { toWebRequest } from "h3";
import federation from "../federation";
import { broadcast, relationStore } from "../store";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const targetUri = body?.targetUri;
  if (typeof targetUri !== "string") {
    throw createError({ statusCode: 400, message: "targetUri is required" });
  }
  const request = toWebRequest(event);
  const ctx = federation.createContext(request, undefined);
  const identifier = "demo";
  const target = await ctx.lookupObject(targetUri);
  if (target == null || target.id == null) {
    throw createError({ statusCode: 404, message: "Actor not found" });
  }
  await ctx.sendActivity(
    { identifier },
    target,
    new Follow({
      id: new URL(
        `#follows/${target.id.href}`,
        ctx.getActorUri(identifier),
      ),
      actor: ctx.getActorUri(identifier),
      object: target.id,
    }),
  );
  broadcast("update", "following");
  return { ok: true };
});
