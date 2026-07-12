<script setup lang="ts">
import SessionManager from "../managers/session.ts";
import {useRouter} from "vue-router";
import {ref} from "vue";

const router = useRouter();
function trySignIn() {
  if (SessionManager.isAuthenticated()) {
    router.push('/dashboard');
  } else {
    SessionManager.beginDiscordAuth();
  }
}

const navbar = ref<HTMLElement | null>(null);
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.value?.classList.add('scrolled');
  } else {
    navbar.value?.classList.remove('scrolled');
  }
}, { passive: true });
</script>

<template>
  <header class="header" ref="navbar">
    <router-link to="/" class="logo">
      <img src="/logo.webp" alt="Logo"/>
      <div class="logo-text">
        Level Thumbnails
      </div>
    </router-link>
    <div class="nav-links">
      <a href="/swagger" class="nav-link">API Docs</a>
      <a href="/#features" class="nav-link">Features</a>
      <a href="/dashboard" @click.prevent="trySignIn" class="nav-link sign-in">
        {{ SessionManager.isAuthenticated() ? "Dashboard" : "Sign in" }}
      </a>
    </div>
  </header>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.header {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 48px;
  background: transparent;
  transition: background 0.4s ease, backdrop-filter 0.4s ease, padding 0.4s ease;
}

.header.scrolled {
  padding: 16px 48px;
  background: rgba(11, 10, 23, 0.8);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.logo img {
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 35%;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.logo-text {
  font-family: "Alata", system-ui, Avenir, Helvetica, Arial, sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
}

.logo:hover img {
  transform: scale(1.05) rotate(-5deg);
}

.logo:active img {
  transform: scale(0.95) rotate(5deg);
}

.logo:focus img {
  outline: none;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 36px;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  font-size: 1rem;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #7eb3ff;
}

.sign-in {
  color: #ddd !important;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  background: rgba(255, 255, 255, 0.1);
}

.sign-in:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff !important;
}

@media (max-width: 768px) {
  .header {
    padding: 16px 24px;
  }

  .nav-links {
    gap: 24px;
  }

  .logo-text {
    font-size: 1rem;
  }

  .nav-link:not(.sign-in) {
    display: none;
  }

  .header.scrolled {
    padding: 12px 24px;
  }

  .sign-in {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
}
</style>