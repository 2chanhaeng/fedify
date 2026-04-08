<script setup lang="ts">
const host = useRequestHeader("x-forwarded-host") ?? useRequestHeader("host") ?? "localhost:3000";
</script>

<template>
  <main class="page">
    <h1>Fedify + Nuxt</h1>
    <p>
      This demo serves a Nuxt page and an ActivityPub actor from the same
      route through content negotiation.
    </p>
    <p>
      Try opening
      <NuxtLink to="/users/demo">/users/demo</NuxtLink>
      in the browser, then run:
    </p>
    <pre><code>fedify lookup http://{{ host }}/users/demo</code></pre>
    <p>
      Handle:
      <strong>@demo@{{ host }}</strong>
    </p>
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

h1 {
  margin-bottom: 1rem;
}

pre {
  padding: 1rem;
  border-radius: 0.75rem;
  background: #f3f4f6;
  overflow-x: auto;
}
</style>
