<script setup lang="ts">
const route = useRoute();
const identifier = route.params.identifier as string;

if (identifier !== "demo") {
  navigateTo("/");
}

const host = useRequestURL().host;
</script>

<template>
  <Head>
    <Title>Fedify Demo - Fedify Nuxt Example</Title>
    <Link rel="stylesheet" href="/style.css" />
    <Script src="/theme.js" />
  </Head>
  <div class="profile-container">
    <NuxtLink class="back-link" to="/">&larr; Back to home</NuxtLink>
    <div class="profile-header">
      <div class="avatar-section">
        <img src="/demo-profile.png" alt="Fedify Demo" class="avatar" />
      </div>
      <div class="user-info">
        <h1 class="user-name">Fedify Demo</h1>
        <p class="user-handle">@{{ identifier }}@{{ host }}</p>
        <p class="user-bio">This is a Fedify Demo account.</p>
      </div>
    </div>
    <div class="profile-content">
      <div class="info-card">
        <h3>Profile Information</h3>
        <div class="info-item">
          <span class="info-label">About</span>
          <span class="info-value">
            This profile is a demo for
            <a href="https://fedify.dev" target="_blank">Fedify</a>
            with <a href="https://nuxt.com" target="_blank">Nuxt</a>.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
