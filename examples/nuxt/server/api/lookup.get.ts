import { toWebRequest } from "h3";
import federation from "../federation";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const handle = query.q;
  if (typeof handle !== "string" || !handle.trim()) {
    return { result: null };
  }
  const request = toWebRequest(event);
  const ctx = federation.createContext(request, undefined);
  try {
    const actor = await ctx.lookupObject(handle.trim());
    if (actor == null || actor.id == null) {
      return { result: null };
    }
    const jsonLd = await actor.toJsonLd() as Record<string, unknown>;
    return {
      result: {
        id: actor.id?.href,
        name: jsonLd.name ?? jsonLd.preferredUsername ?? "Unknown",
        handle: handle.trim(),
        icon: (jsonLd.icon as Record<string, unknown>)?.url ?? null,
      },
    };
  } catch {
    return { result: null };
  }
});
