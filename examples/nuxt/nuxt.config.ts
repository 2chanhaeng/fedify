import fedifyModule from "@fedify/nuxt";

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
  devServer: {
    host: "0.0.0.0",
  },
});
