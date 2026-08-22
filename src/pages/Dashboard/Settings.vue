<script setup lang="ts">
import {computed, ref, watch} from "vue";
import SessionManager from "../../managers/session.ts";
import type {ServerSettings} from "../../lib/types";
import {fetchJson} from "../../lib/utils.ts";
import {alertModal, confirmModal} from "../../lib/modals";
import SettingsManager, {type UserSettings} from "../../managers/settings.ts";
import Modal from "../../components/Modal.vue";

const user = ref(SessionManager.getUser()!);
const token = ref("");
const loadingToken = ref(false);
const linkingError = ref("");

function hasServerSettingsPerms() {
  return user.value && (user.value.role === 'admin' || user.value.role === 'owner');
}

function hasModeratorPerms() {
  return user.value && (user.value.role === 'moderator' || user.value.role === 'admin' || user.value.role === 'owner');
}

function downloadMyData() {

}

async function deleteAccount() {
  await confirmModal(
      'Delete My Account',
      'Are you sure you want to delete your account and all data associated with it? This action cannot be undone.'
  );
}

async function copyToken() {
  if (token.value !== "") {
    await navigator.clipboard.writeText(token.value);
    return;
  }

  if (loadingToken.value) return;
  loadingToken.value = true;

  try {
    const data = await fetchJson<{ token: string }>('/auth/link');

    token.value = data.token;
    await navigator.clipboard.writeText(token.value);
  } catch (error) {
    console.error("Error linking account:", error);
    linkingError.value = error instanceof Error ? error.message : 'An unknown error occurred';
  } finally {
    loadingToken.value = false;
  }
}

function verifyAccount() {
  SessionManager.validateSession().then(() => {
    const userData = SessionManager.getUser();
    if (userData) {
      user.value = userData;
      if (user.value.account_id === -1) {
        linkingError.value = "Account linking failed. Please try again.";
      } else {
        linkingError.value = "";
      }
    }
  })
}

// if admin, fetch server settings
const settings = ref<ServerSettings | null>(null);
const pendingSettings = ref<ServerSettings | null>(null);
const pendingEnergyConfig = ref<ServerSettings['energy_config'] | null>(null);
const energySettingsModalOpen = ref(false);
if (hasServerSettingsPerms()) {
  fetchJson<ServerSettings>('/admin/settings')
      .then((data) => {
        settings.value = data;
        pendingSettings.value = {...data};
        pendingEnergyConfig.value = {...data.energy_config};
      })
      .catch(error => {
        console.error("Error fetching server settings:", error);
      });
}

const isDirty = computed(() => {
  return JSON.stringify(settings.value) !== JSON.stringify(pendingSettings.value) ||
         JSON.stringify(pendingEnergyConfig.value) !== JSON.stringify(settings.value?.energy_config);
});

async function updateServerSettings(silent: boolean) {
  if (!pendingSettings.value) return;

  pendingEnergyConfig.value!.popularity_tiers.sort((a, b) => b[0] - a[0]);
  pendingSettings.value.energy_config = pendingEnergyConfig.value!;

  try {
    await fetchJson('/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({...pendingSettings.value, "stealth": silent})
    });

    settings.value = {...pendingSettings.value};
    await alertModal('Server Settings', 'Server settings updated successfully.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await alertModal('Server Settings', `Error updating server settings: ${message}`);
  }
}

const userSettings = ref<UserSettings>(SettingsManager.getSettings());
watch(userSettings, (newSettings) => {
  SettingsManager.saveSettings(newSettings);
}, {deep: true});

</script>

<template>
  <div>
    <section v-if="user.account_id == -1">
      <div class="warning-info">
        Please link your <b>Geometry Dash</b> account below
      </div>
      <p class="flex-3">
        To link your account, press the "Link Account" button, which will copy your secret token to the clipboard.
        Then, open Geometry Dash, go to Level Thumbnails settings, and paste the token into the "Link Account" form.
        <br/>
        After that, return to this page and click the "Verify Account" button to check if the linking was successful.
      </p>
      <div class="d-flex">
        <input type="text" v-model="token" class="flex-3 link-token" placeholder="Your secret token will appear here"
               readonly/>
        <button @click="copyToken" class="btn btn-secondary flex-1 link-account" :disabled="loadingToken">
          {{ token ? "Copy Token" : "Link Account" }}
        </button>
      </div>
      <button @click="verifyAccount" class="btn btn-success w-100 mt-1">
        Verify Account
      </button>
      <p v-if="linkingError" class="error-message">
        {{ linkingError }}
      </p>
    </section>
    <section v-if="hasServerSettingsPerms() && settings && pendingSettings">
      <h3>Server Settings</h3>
      <div class="d-flex gap-1">
        <button class="btn flex-1"
                :class="{ 'btn-danger': pendingSettings.pause_submissions, 'btn-success': !pendingSettings.pause_submissions }"
                @click="pendingSettings.pause_submissions = !pendingSettings.pause_submissions;">
          {{ pendingSettings.pause_submissions ? "Submissions Paused" : "Submissions Active" }}
        </button>
      </div>
      <div class="d-flex mt-1 setting-row">
        <label for="minClient" class="setting-label">Minimum Mod Version:</label>
        <input id="minClient" type="text"
               v-model="pendingSettings.min_supported_client" class="setting-input link-token"
               placeholder="e.g. v2.1.0" pattern="^v\d+\.\d+\.\d+(?:-(?:alpha|beta|prerelease|pr)(?:\.\d+)?)?$"/>
      </div>
      <div class="d-flex mt-1 setting-row">
        <button class="btn flex-1 btn-dark" @click="energySettingsModalOpen = true">
          Edit Energy Settings
        </button>
      </div>
      <div class="d-flex gap-1 mt-1">
        <button class="btn btn-primary flex-1" @click="updateServerSettings(false)"
                :disabled="!isDirty">
          Save Changes
        </button>
        <button class="btn btn-secondary flex-1" @click="updateServerSettings(true)"
                :disabled="!isDirty">
          Save Silently
        </button>
      </div>
    </section>
    <section v-if="hasModeratorPerms()">
      <h3>Settings</h3>
      <div class="d-flex mt-1">
        <button class="btn flex-1"
                :class="{ 'btn-danger': !userSettings.confirm_accept, 'btn-success': userSettings.confirm_accept }"
                @click="userSettings.confirm_accept = !userSettings.confirm_accept;">
          {{
            userSettings.confirm_accept ? "Confirmation for accept is enabled" : "Confirmation for accept is disabled"
          }}
        </button>
      </div>
      <div class="d-flex mt-1">
        <button class="btn flex-1"
                :class="{ 'btn-danger': !userSettings.confirm_reject, 'btn-success': userSettings.confirm_reject }"
                @click="userSettings.confirm_reject = !userSettings.confirm_reject;">
          {{
            userSettings.confirm_reject ? "Confirmation for reject is enabled" : "Confirmation for reject is disabled"
          }}
        </button>
      </div>
    </section>
    <section>
      <h3>Privacy & Data</h3>
      <p class="note">
        We store your Geometry Dash account ID, Discord ID, and any thumbnails you upload.
        Learn more in our <a href="/privacy" target="_blank">Privacy Policy</a>.
      </p>
      <div class="d-flex gap-1">
        <button @click="downloadMyData" class="btn btn-primary flex-1">
          Request My Data
        </button>
        <button @click="deleteAccount" class="btn btn-danger flex-1">
          Delete My Account
        </button>
      </div>
    </section>
    <section class="mobile-only">
      <button @click="SessionManager.logout()" class="btn btn-black logout-button w-100">
        <img src="/icons/logout.svg" alt="Logout" class="avatar"/>
        Logout
      </button>
    </section>
  </div>
  <Modal
      title="Energy Settings" :open="energySettingsModalOpen"
      :buttons="[{ label: 'Confirm' }]"
      @close="energySettingsModalOpen = false"
      @action="_ => energySettingsModalOpen = false"
  >
    <div class="d-flex setting-row">
      <label class="setting-label">Energy System:</label>
      <button class="btn flex-1"
              :class="{ 'btn-danger': !pendingEnergyConfig!.enabled, 'btn-success': pendingEnergyConfig!.enabled }"
              @click="pendingEnergyConfig!.enabled = !pendingEnergyConfig!.enabled">
        {{ pendingEnergyConfig!.enabled ? "Enabled" : "Disabled" }}
      </button>
    </div>

    <div class="d-flex setting-row">
      <label for="maxMillipoints" class="setting-label">Max Energy:</label>
      <input id="maxMillipoints" type="number" v-model.number="pendingEnergyConfig!.max_millipoints"
             class="setting-input link-token"/>
    </div>

    <div class="d-flex setting-row">
      <label for="refillRate" class="setting-label">Refill Rate:</label>
      <input id="refillRate" type="number"
             v-model.number="pendingEnergyConfig!.refill_rate" class="setting-input link-token"/>
    </div>

    <div class="d-flex setting-row">
      <label for="baseCost" class="setting-label">Base Cost:</label>
      <input id="baseCost" type="number"
             v-model.number="pendingEnergyConfig!.base_cost" class="setting-input link-token"/>
    </div>

    <div class="d-flex setting-row">
      <label for="minCost" class="setting-label">Min Cost:</label>
      <input id="minCost" type="number"
             v-model.number="pendingEnergyConfig!.min_cost" class="setting-input link-token"/>
    </div>

    <div class="d-flex setting-row">
      <label for="downloadWeight" class="setting-label">Download Weight:</label>
      <input id="downloadWeight" type="number" step="0.01"
             v-model.number="pendingEnergyConfig!.download_weight" class="setting-input link-token"/>
    </div>

    <div class="d-flex setting-row">
      <label for="ratedWeight" class="setting-label">Rated Weight:</label>
      <input id="ratedWeight" type="number" step="0.01"
             v-model.number="pendingEnergyConfig!.rated_weight" class="setting-input link-token"/>
    </div>

    <div class="d-flex setting-row">
      <label for="creatorMult" class="setting-label">Creator Mult:</label>
      <input id="creatorMult" type="number" step="0.01"
             v-model.number="pendingEnergyConfig!.creator_mult" class="setting-input link-token"/>
    </div>

    <div class="d-flex setting-row">
      <label for="creatorMinDL" class="setting-label">Creator Min Downloads:</label>
      <input id="creatorMinDL" type="number"
             v-model.number="pendingEnergyConfig!.creator_min_downloads" class="setting-input link-token"/>
    </div>

    <div>
      <p>Popularity Tiers (Score / Weight):</p>
      <div v-for="(tier, index) in pendingEnergyConfig!.popularity_tiers" :key="index"
           class="d-flex gap-05 mb-05 align-center">
        <input type="number" v-model.number="tier[0]" class="setting-input link-token" placeholder="Score"/>
        <input type="number" step="0.01" v-model.number="tier[1]" class="setting-input link-token"
               placeholder="Weight"/>
        <button class="btn btn-danger" @click="pendingEnergyConfig!.popularity_tiers.splice(index, 1)">X
        </button>
      </div>
      <button class="btn btn-secondary w-100 mt-1"
              @click="pendingEnergyConfig!.popularity_tiers.push([0, 0.0])">
        Add Tier
      </button>
    </div>
  </Modal>
</template>

<style scoped>
section {
  background-color: rgba(0, 0, 0, 0.25);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

h3 {
  margin: 0 0 10px 0;
  color: #fff;
}

.note {
  color: #aaa;
  font-size: 0.9em;
}

.setting-row {
  align-items: center;
}

.setting-label {
  width: 180px;
  min-width: 120px;
  color: #fff;
  display: flex;
  align-items: center;
}

.setting-input {
  flex: 1;
}

.setting-input.link-token {
  border-radius: 8px;
}

@media (max-width: 640px) {
  .setting-row {
    flex-direction: column;
    align-items: stretch;
  }

  .setting-label {
    width: auto;
    min-width: 0;
    margin-bottom: 8px;
  }
}

.link-token {
  background-color: #fff;
  color: #000;
  border: 0;
  border-radius: 8px 0 0 8px;
  padding: 10px;
  font-size: 1em;
}

.link-account {
  border: none;
  border-radius: 0 8px 8px 0;
  padding: 10px;
  font-size: 1em;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

button > img {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.btn-black {
  background-color: #000;
  color: #fff;
}

.btn-black:hover {
  background-color: #333;
}

</style>