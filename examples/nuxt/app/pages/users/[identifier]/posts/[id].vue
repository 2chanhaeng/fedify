<script setup lang="ts">
import { Note } from "@fedify/vocab";

const route = useRoute();
const identifier = route.params.identifier as string;
const id = route.params.id as string;

if (identifier !== "demo") {
  navigateTo("/");
}

const host = useRequestURL().host;

const { data: postData } = await useFetch(`/api/post-detail`, {
  query: { identifier, id },
});
</script>

<template>
  <Head>
    <Title>Post - Fedify Nuxt Example</Title>
    <Link rel="stylesheet" href="/style.css" />
    <Script src="/theme.js" />
  </Head>
  <div class="post-detail-container">
    <NuxtLink class="back-link" to="/">&larr; Back to home</NuxtLink>
    <article class="post-detail-card">
      <NuxtLink class="post-detail-author" :to="`/users/${identifier}`">
        <img src="/demo-profile.png" alt="Fedify Demo" class="author-avatar" />
        <div class="author-info">
          <h1 class="author-name">Fedify Demo</h1>
          <p class="author-handle">@{{ identifier }}@{{ host }}</p>
        </div>
      </NuxtLink>
      <div v-if="postData" class="post-detail-content">
        <p>{{ (postData as any).content }}</p>
        <time v-if="(postData as any).published" class="post-timestamp">
          {{ new Date((postData as any).published).toLocaleString() }}
        </time>
      </div>
      <div v-else class="empty-text">Post not found.</div>
    </article>
  </div>
</template>
