import { Create, Note } from "@fedify/vocab";
import { toWebRequest } from "h3";
import federation from "../federation";
import { broadcast, postStore } from "../store";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const content = body?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw createError({ statusCode: 400, message: "Content is required" });
  }
  const request = toWebRequest(event);
  const ctx = federation.createContext(request, undefined);
  const identifier = "demo";
  const id = crypto.randomUUID();
  const attribution = ctx.getActorUri(identifier);
  const url = new URL(`/users/${identifier}/posts/${id}`, attribution);
  const post = new Note({
    id: url,
    attribution,
    content: content.trim(),
    url,
    published: Temporal.Now.instant(),
  });
  try {
    postStore.append([post]);
    const note = await ctx.getObject(Note, { identifier, id });
    await ctx.sendActivity(
      { identifier },
      "followers",
      new Create({
        id: new URL("#activity", url),
        object: note,
        actors: note?.attributionIds,
        tos: note?.toIds,
        ccs: note?.ccIds,
      }),
    );
  } catch {
    postStore.delete(url);
  }
  broadcast("update", "posts");
  return { ok: true };
});
