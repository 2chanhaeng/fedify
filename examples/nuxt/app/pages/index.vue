<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";

const host = useRequestURL().host;
const handle = `@demo@${host}`;

const searchQuery = ref("");
const searchResult = ref<{
  id: string;
  name: string;
  handle: string;
  icon: string | null;
} | null>(null);
const searching = ref(false);
const followingList = ref<string[]>([]);
const followerList = ref<string[]>([]);
const posts = ref<{ id: string; content: string; published: string; url: string }[]>([]);
const postContent = ref("");
const posting = ref(false);

const { data: initialData } = await useFetch("/api/state");

if (initialData.value) {
  followingList.value = (initialData.value as any).following ?? [];
  followerList.value = (initialData.value as any).followers ?? [];
  posts.value = (initialData.value as any).posts ?? [];
}

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, (q) => {
  clearTimeout(searchTimeout);
  if (!q.trim()) {
    searchResult.value = null;
    return;
  }
  searching.value = true;
  searchTimeout = setTimeout(async () => {
    const { data } = await useFetch(`/api/lookup`, { query: { q } });
    searchResult.value = (data.value as any)?.result ?? null;
    searching.value = false;
  }, 300);
});

async function submitPost() {
  if (!postContent.value.trim() || posting.value) return;
  posting.value = true;
  await $fetch("/api/post", {
    method: "POST",
    body: { content: postContent.value },
  });
  postContent.value = "";
  posting.value = false;
  await refreshState();
}

async function followActor() {
  if (!searchResult.value) return;
  await $fetch("/api/follow", {
    method: "POST",
    body: { targetUri: searchResult.value.id },
  });
  await refreshState();
}

async function unfollowActor(uri: string) {
  await $fetch("/api/unfollow", {
    method: "POST",
    body: { targetUri: uri },
  });
  await refreshState();
}

async function refreshState() {
  const { data } = await useFetch("/api/state", { key: Date.now().toString() });
  if (data.value) {
    followingList.value = (data.value as any).following ?? [];
    followerList.value = (data.value as any).followers ?? [];
    posts.value = (data.value as any).posts ?? [];
  }
}

let eventSource: EventSource | null = null;
onMounted(() => {
  eventSource = new EventSource("/api/events");
  eventSource.addEventListener("update", () => {
    refreshState();
  });
});
onUnmounted(() => {
  eventSource?.close();
});
</script>

<template>
  <Head>
    <Title>Fedify Nuxt Example</Title>
    <Link rel="stylesheet" href="/style.css" />
    <Script src="/theme.js" />
  </Head>
  <main class="home-container">
    <section class="search-section">
      <h2>Search</h2>
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        placeholder="Search by handle (e.g. @user@example.com)"
      />
      <div v-if="searching" class="search-status">Searching...</div>
      <div v-if="searchResult" class="search-result">
        <img
          :src="searchResult.icon ?? '/demo-profile.png'"
          :alt="searchResult.name"
          class="search-avatar"
        />
        <div class="search-info">
          <span class="search-name">{{ searchResult.name }}</span>
          <span class="handle-badge">{{ searchResult.handle }}</span>
        </div>
        <button
          v-if="!followingList.includes(searchResult.id)"
          class="btn-primary"
          @click="followActor"
        >Follow</button>
        <button
          v-else
          class="btn-danger"
          @click="unfollowActor(searchResult.id)"
        >Unfollow</button>
      </div>
    </section>

    <section class="profile-header">
      <div class="avatar-section">
        <img src="/demo-profile.png" alt="Fedify Demo" class="avatar" />
      </div>
      <div class="user-info">
        <h1 class="user-name">Fedify Demo</h1>
        <p class="user-handle">{{ handle }}</p>
        <p class="user-bio">This is a Fedify Demo account.</p>
      </div>
    </section>

    <section class="info-card">
      <h2>Following ({{ followingList.length }})</h2>
      <div v-if="followingList.length === 0" class="empty-text">
        Not following anyone yet.
      </div>
      <div v-for="uri in followingList" :key="uri" class="follower-row">
        <img src="/demo-profile.png" alt="" class="row-avatar" />
        <span class="handle-badge">{{ uri }}</span>
        <button class="btn-danger" @click="unfollowActor(uri)">Unfollow</button>
      </div>
    </section>

    <section class="info-card">
      <h2>Followers ({{ followerList.length }})</h2>
      <div v-if="followerList.length === 0" class="empty-text">
        No followers yet.
      </div>
      <div v-for="uri in followerList" :key="uri" class="follower-row">
        <img src="/demo-profile.png" alt="" class="row-avatar" />
        <span class="handle-badge">{{ uri }}</span>
      </div>
    </section>

    <section class="info-card">
      <h2>Compose</h2>
      <form @submit.prevent="submitPost">
        <textarea
          v-model="postContent"
          class="form-textarea"
          placeholder="What's on your mind?"
          rows="3"
        ></textarea>
        <button type="submit" class="btn-primary" :disabled="posting">
          {{ posting ? "Posting..." : "Post" }}
        </button>
      </form>
    </section>

    <section class="info-card">
      <h2>Posts</h2>
      <div v-if="posts.length === 0" class="empty-text">No posts yet.</div>
      <article v-for="post in posts" :key="post.id" class="post-card">
        <NuxtLink :to="post.url" class="post-link">
          <div class="post-header">
            <img src="/demo-profile.png" alt="Fedify Demo" class="post-avatar" />
            <div class="post-user-info">
              <h3 class="post-user-name">Fedify Demo</h3>
              <p class="post-user-handle">{{ handle }}</p>
            </div>
          </div>
          <div class="post-content">
            <p>{{ post.content }}</p>
          </div>
          <time v-if="post.published" class="post-timestamp">
            {{ new Date(post.published).toLocaleString() }}
          </time>
        </NuxtLink>
      </article>
    </section>
  </main>
</template>
