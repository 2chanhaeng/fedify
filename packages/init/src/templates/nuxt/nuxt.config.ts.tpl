// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-10",
  devtools: { enabled: true },
  nitro: {
    errorHandler: "~/server/error",
    esbuild: {
      options: {
        target: "esnext",
      },
    },
    imports: false,
  },
  imports: false,
  srcDir: ".",
});
