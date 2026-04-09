// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-10",
  devtools: { enabled: false },
  nitro: {
    errorHandler: "~/server/error",
    esbuild: {
      options: {
        target: "esnext",
      },
    },
  },
  ssr: true,
});
