import fedifyModule from "@fedify/nuxt";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [fedifyModule],
  nitro: {
    // `~~/` is the alias for the Nuxt project root.  It resolves to
    // `<rootDir>/server/error.ts` regardless of whether `srcDir` is the
    // root (Nuxt 3 default) or `app/` (Nuxt 4 default).
    errorHandler: "~~/server/error",
  },
  compatibilityDate: "2025-01-01",
});
