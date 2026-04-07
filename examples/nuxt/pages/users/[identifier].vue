<script setup lang="ts">
const route = useRoute();
const identifier = route.params.identifier as string;
const { data: profile } = await useFetch(`/api/profile/${identifier}`);
</script>

<template>
  <main>
    <h1>Fedify + Nuxt</h1>
    <div v-if="profile" class="profile">
      <img
        :src="profile.icon"
        alt="Profile"
        width="80"
        height="80"
      />
      <h2>{{ profile.name }}</h2>
      <p><code>@{{ profile.preferredUsername }}@{{ profile.host }}</code></p>
      <p>{{ profile.summary }}</p>
      <p>
        <strong>Followers:</strong> {{ profile.followersCount }}
      </p>
    </div>
    <p v-else>User not found.</p>
    <p>
      Try:
      <code>
        curl -H "Accept: application/activity+json"
        http://localhost:3000/users/{{ identifier }}
      </code>
    </p>
  </main>
</template>
