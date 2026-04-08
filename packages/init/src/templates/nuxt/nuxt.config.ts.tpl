import fedifyModule from "@fedify/nuxt";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [fedifyModule],
  nitro: {
    errorHandler: "~~/server/error",
    esbuild: {
      options: {
        target: "esnext",
      },
    },
  },
  compatibilityDate: "2025-01-01",
});
