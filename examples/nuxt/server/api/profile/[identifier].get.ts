import { relationStore } from "../../lib/store";

export default defineEventHandler(async (event) => {
  const identifier = getRouterParam(event, "identifier");

  if (identifier !== "demo") {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  const host = getRequestHost(event);
  const followers = Array.from(relationStore.values());

  return {
    identifier,
    name: "Fedify Demo",
    summary: "This is a Fedify Demo account.",
    preferredUsername: identifier,
    icon: "/demo-profile.png",
    host,
    followersCount: followers.length,
  };
});
