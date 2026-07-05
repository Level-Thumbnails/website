<script setup lang="ts">
import SessionManager from "../managers/session.ts";
import LoadingCircle from "../components/LoadingCircle.vue";
import {ref, watch} from "vue";
import Settings from "./Dashboard/Settings.vue";
import Pending from "./Dashboard/Pending.vue";
import Thumbnails from "./Dashboard/Thumbnails.vue";
import Dashboard from "./Dashboard/Dashboard.vue";
import Users from "./Dashboard/Users.vue";

const user = ref(SessionManager.getUser());

SessionManager.validateSession().then(() => {
  user.value = SessionManager.getUser();
}).catch((error) => {
  console.error("Session validation failed:", error);
  SessionManager.logout();
});

const currentPage = ref(window.location.hash.replace('#', '') || '');
const isSidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true');

watch(isSidebarCollapsed, (value) => {
  localStorage.setItem('sidebarCollapsed', value.toString());
});

function hasPendingPerms() {
  return user.value && (
      user.value.role === 'owner' ||
      user.value.role === 'admin' ||
      user.value.role === 'moderator'
  );
}

const PAGES = [
  {name: "Dashboard", path: "", icon: '/icons/dashboard.svg'},
  {name: "My Thumbnails", path: "thumbnails", icon: '/icons/photos.svg'},
  {name: "Pending", path: "pending", icon: '/icons/pending.svg', requires: hasPendingPerms},
  {name: "Users", path: "users", icon: '/icons/users.svg', requires: hasPendingPerms},
  {name: "Settings", path: "settings", icon: '/icons/settings.svg'},
]

</script>

<template>
  <LoadingCircle backdrop v-if="!user"/>
  <main v-else>
    <div class="sidebar appear" :class="{ collapsed: isSidebarCollapsed }">
      <div class="title">
        <h3>
          <img src="/logo.webp" alt="Logo" style="width: 32px; height: auto;"/>
          <span class="title-text">Level Thumbnails</span>
        </h3>
      </div>
      <div class="navbar slide-right">
        <button
            class="nav-link nav-toggle"
            type="button"
            :aria-label="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            @click="isSidebarCollapsed = !isSidebarCollapsed"
        >
          <span class="toggle-icon">{{ isSidebarCollapsed ? '»' : '«' }}</span>
          <span>{{ isSidebarCollapsed ? 'Expand' : 'Collapse' }}</span>
        </button>
        <a v-for="page in PAGES.filter(p => {
          if (p.requires) {
            return p.requires();
          }
          return true;
        })" :key="page.name" :href="'#' + page.path" class="nav-link"
           :class="{ active: currentPage === page.path }" @click="currentPage = page.path">
          <img v-if="page.icon" :src="page.icon" alt=""/>
          <span>{{ page.name }}</span>
        </a>
      </div>
      <div class="filler"></div>
      <div class="warning-info" v-if="user.account_id == -1">
        <p>
          You haven't linked your <b>Geometry Dash</b> account!
          Visit the <b>Settings</b> page.
        </p>
        <p>
          <a href="#settings" @click="currentPage = 'settings'">Go to Settings</a>
        </p>
      </div>
      <div class="user-info">
        <img src="/user.svg" alt="User Avatar" class="avatar"/>
        <span class="username">{{ user.username }}</span>
        <span class="user-role" v-if="user.role">({{ user.role }})</span>
        <a href="/auth/logout" class="logout-link">
          <img src="/icons/logout.svg" alt="Logout" class="avatar"/>
        </a>
      </div>
    </div>
    <div class="content">
      <Dashboard v-if="currentPage === '' || currentPage === 'dashboard'" class="page-transition"/>
      <Thumbnails v-if="currentPage === 'thumbnails'" class="page-transition"/>
      <Pending v-if="currentPage === 'pending' && hasPendingPerms()" class="page-transition"/>
      <Settings v-if="currentPage === 'settings'" class="page-transition"/>
      <Users v-if="currentPage === 'users' && hasPendingPerms()" class="page-transition"/>
    </div>
  </main>
</template>

<style scoped>
main {
  display: flex;
  height: 100svh;
}

.sidebar {
  width: 250px;
  height: calc(100svh - 40px);
  padding: 20px;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  transition: width 0.25s ease;
  overflow: visible;
}

.content {
  flex: 1;
  padding: 20px;
  margin: 20px 20px 20px 290px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: margin-left 0.25s ease;
}

.title {
  width: fit-content;
  margin: 0 auto;
  white-space: nowrap;
}

.sidebar h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  overflow: hidden;
}

.navbar {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 10px;
  border-radius: 12px;
}

.nav-link {
  color: #bbb;
  text-decoration: none;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 12px;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
}

.nav-link img {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.nav-link:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

.nav-link.active {
  color: #ffffff;
  background-color: rgba(0, 0, 0, 0.5);
}

.filler {
  flex-grow: 1;
}

.warning-info {
  background: linear-gradient(135deg, #f9dc4e, #f4c162, #df9f68);
  padding: 10px;
  border-radius: 12px;
  color: #000;
  font-size: 0.9em;
}

.warning-info p {
  margin: 5px 0;
}

.warning-info a {
  color: #000;
  display: inline-block;
  margin-top: 5px;
  text-decoration: none;
  background-color: rgba(255, 255, 255, 0.75);
  padding: 5px 10px;
  border-radius: 8px;
  transition: color 0.3s ease;
}

.warning-info a:hover {
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 10px;
  border-radius: 12px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.username {
  font-weight: bold;
  color: #ffffff;
}

.user-role {
  color: #aaa;
  font-style: italic;
}

.logout-link {
  margin-left: auto;
  display: flex;
  align-items: center;
}

@media (min-width: 769px) {
  .nav-toggle {
    border: none;
    background-color: transparent;
    cursor: pointer;
    width: 100%;
    font: inherit;
  }

  .toggle-icon {
    width: 20px;
    text-align: center;
    margin-right: 8px;
    font-size: 16px;
    line-height: 1;
  }

  .sidebar.collapsed {
    width: 48px;
    padding: 20px 8px;
  }

  .sidebar.collapsed .title {
    margin: 0 auto;
  }

  .sidebar.collapsed .title-text,
  .sidebar.collapsed .warning-info,
  .sidebar.collapsed .username,
  .sidebar.collapsed .user-role,
  .sidebar.collapsed .logout-link {
    display: none;
  }

  .sidebar.collapsed .navbar {
    margin-top: 12px;
    padding: 8px 6px;
  }

  .sidebar.collapsed .nav-link {
    justify-content: center;
    padding: 10px;
  }

  .sidebar.collapsed .nav-link span {
    display: none;
  }

  .sidebar.collapsed .nav-link .toggle-icon {
    display: inline-block;
    margin-right: 0;
  }

  .sidebar.collapsed .nav-link img {
    margin-right: 0;
  }

  .sidebar.collapsed .user-info {
    justify-content: center;
    gap: 0;
    margin-top: 12px;
    padding: 8px;
  }

  .sidebar.collapsed + .content {
    margin-left: 64px;
  }
}

.appear {
  animation: fade-in 2s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.slide-right {
  animation: slide-right 0.75s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.page-transition {
  animation: fade-in 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-right {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slide-left {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

/* mobile layout */

@media (max-width: 768px) {
  html {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.5) transparent;
    -ms-overflow-style: none; /* IE and Edge */
    overflow-y: scroll;
  }

  .sidebar {
    width: calc(100% - 20px);
    height: fit-content !important;
    position: fixed;
    bottom: 0;
    z-index: 1000;
    padding: 10px;
    overflow-y: auto;
  }

  .sidebar > .title, .sidebar > .warning-info, .sidebar > .user-info {
    display: none;
  }

  .nav-toggle {
    display: none;
  }

  .content {
    margin: 10px;
    padding: 10px 10px 80px;
    width: 100%;
    min-height: max-content;
    background-color: transparent;
  }

  @media (-webkit-min-device-pixel-ratio:0) {
    .content > :deep(div) {
      padding-bottom: 80px;
    }
  }

  .navbar {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 5px;
    backdrop-filter: blur(12px);
  }

  .nav-link {
    flex: 1 1 calc(50% - 10px);
    justify-content: center;
    text-align: center;
    padding: 10px;
    -webkit-tap-highlight-color: transparent;
  }

  .nav-link.active {
    background-color: rgba(0, 0, 0, 0.5);
    color: #ffffff;
  }

  .nav-link span {
    display: none;
  }

  .nav-link img {
    width: 24px;
    height: 24px;
    margin: 0;
    pointer-events: none;
  }

  .nav-link:hover {
    background-color: rgba(0, 0, 0, 0.4);
  }

  .nav-link:active {
    background-color: rgba(0, 0, 0, 0.6);
  }

  .slide-right {
    animation: slide-top 0.75s cubic-bezier(0.25, 0.1, 0.25, 1);
  }
}

</style>