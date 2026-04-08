<script setup lang="ts">
const route = useRoute();
const identifier = computed(() => String(route.params.identifier ?? ""));
if (identifier.value !== "demo") {
  throw createError({ statusCode: 404, statusMessage: "User not found" });
}
const host = useRequestHeader("x-forwarded-host") ?? useRequestHeader("host") ?? "localhost:3000";
</script>

<template>
  <main class="page">
    <p><NuxtLink to="/">Back</NuxtLink></p>
    <h1>@{{ identifier }}</h1>
    <p>This HTML page shares its route with the Fedify actor dispatcher.</p>
    <p>Actor URL: <code>http://{{ host }}/users/{{ identifier }}</code></p>
  </main>
</template>

<style scoped>
.page {
  max-width: 48rem;
  margin: 4rem auto;
  padding: 0 1.5rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  line-height: 1.6;
}
</style>
