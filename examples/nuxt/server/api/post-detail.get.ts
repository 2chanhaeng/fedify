import { Note } from "@fedify/vocab";
import { toWebRequest } from "h3";
import federation from "../federation";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const identifier = query.identifier as string;
  const id = query.id as string;
  if (!identifier || !id) {
    throw createError({ statusCode: 400, message: "Missing parameters" });
  }
  const request = toWebRequest(event);
  const ctx = federation.createContext(request, undefined);
  const noteObj = await ctx.getObject(Note, { identifier, id });
  if (!noteObj) {
    throw createError({ statusCode: 404, message: "Post not found" });
  }
  const jsonLd = await noteObj.toJsonLd() as Record<string, unknown>;
  return {
    content: jsonLd.content,
    published: jsonLd.published,
    url: noteObj.id?.href,
  };
});
