import { postStore, relationStore } from "../store";

export default defineEventHandler(async () => {
  const followers = Array.from(relationStore.keys());
  const allPosts = postStore.getAll();
  const posts = await Promise.all(
    allPosts.map(async (p) => {
      const jsonLd = await p.toJsonLd() as Record<string, unknown>;
      return {
        id: p.id?.href,
        content: jsonLd.content,
        published: jsonLd.published,
        url: p.id?.href,
      };
    }),
  );
  return { following: [], followers, posts };
});
