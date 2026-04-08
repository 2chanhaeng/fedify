export default defineNuxtConfig({
  modules: ["@fedify/nuxt"],
  nitro: {
    esbuild: {
      options: {
        target: "es2022",
      },
    },
  },
  fedify: {
    federation: "~~/server/federation",
  },
});