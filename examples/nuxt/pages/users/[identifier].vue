<template>
  <div>
    <p><NuxtLink to="/">&larr; Back to home</NuxtLink></p>
    <h1>{{ identifier }}</h1>
    <p>
      This is the profile page for <strong>@{{ identifier }}</strong>.
    </p>
    <p>
      When accessed with an <code>Accept: application/activity+json</code>
      header, this page returns the ActivityPub actor JSON-LD document instead.
    </p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const identifier = route.params.identifier as string;
</script>
