<script setup lang="ts">
const route = useRoute();
const host = ref("");

onMounted(() => {
  host.value = window.location.host;
});

const handle = computed(() => `@demo@${host.value || "this-server"}`);
</script>

<template>
  <main class="container">
    <h1>Fedify + Nuxt</h1>
    <p>
      A small federated server demo built with
      <a href="https://fedify.dev/" target="_blank" rel="noreferrer">Fedify</a>
      and <a href="https://nuxt.com/" target="_blank" rel="noreferrer">Nuxt</a>.
      It exposes an ActivityPub actor at the path
      <code>{{ route.path === "/" ? "/users/demo" : route.path }}</code>.
    </p>
    <p>
      You can follow this demo account from any ActivityPub-compatible server
      (Mastodon, Pleroma, Misskey, …) using the handle:
    </p>
    <p class="handle"><code>{{ handle }}</code></p>
    <p>
      To make this server reachable from the public fediverse during local
      development, run <code>fedify tunnel 3000</code> in another terminal and
      use the tunnel hostname instead of <code>localhost</code>.
    </p>
  </main>
</template>

<style scoped>
.container {
  max-width: 640px;
  margin: 4rem auto;
  padding: 0 1.5rem;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  line-height: 1.6;
}

h1 {
  margin-bottom: 1rem;
}

p {
  margin-bottom: 1rem;
}

.handle {
  font-size: 1.25rem;
  text-align: center;
}

code {
  background: rgba(127, 127, 127, 0.15);
  padding: 0.1em 0.35em;
  border-radius: 0.25em;
}
</style>
