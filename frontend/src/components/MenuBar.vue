<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import UserServices from "../services/userServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const sessionUser = ref(Utils.getStore("user") || {});

const refreshUser = () => {
  sessionUser.value = Utils.getStore("user") || {};
};

onMounted(() => {
  refreshUser();
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});

const fullName = computed(() => {
  const { fName, lName, username } = sessionUser.value;
  const name = [fName, lName].filter(Boolean).join(" ");
  return name || username || "";
});

const editDialog = ref(false);
const form = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const profile = ref({
  fName: "",
  lName: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
});

const firstNameRules = [(value) => !!value?.trim() || "First name is required."];
const lastNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => value === profile.value.password || "Passwords do not match.",
];

const openEditDialog = async () => {
  errorMessage.value = "";
  const current = Utils.getStore("user") || {};
  profile.value = {
    fName: current.fName || "",
    lName: current.lName || "",
    email: current.email || "",
    username: current.username || "",
    password: "",
    confirmPassword: "",
  };

  if (current.userId) {
    try {
      const res = await UserServices.getUser(current.userId);
      profile.value = {
        fName: res.data.fName,
        lName: res.data.lName,
        email: res.data.email,
        username: res.data.username,
        password: "",
        confirmPassword: "",
      };
    } catch {
      // Fall back to the session values already loaded.
    }
  }

  editDialog.value = true;
};

const closeEditDialog = () => {
  editDialog.value = false;
};

const saveProfile = async () => {
  errorMessage.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  const current = Utils.getStore("user") || {};
  const payload = {
    fName: profile.value.fName.trim(),
    lName: profile.value.lName.trim(),
    email: profile.value.email.trim(),
    username: profile.value.username.trim(),
  };
  if (profile.value.password) {
    payload.password = profile.value.password;
  }

  loading.value = true;
  try {
    const res = await UserServices.updateUser(current.userId, payload);
    Utils.setStore("user", {
      ...current,
      userId: current.userId,
      token: current.token,
      fName: res.data.fName,
      lName: res.data.lName,
      email: res.data.email,
      username: res.data.username,
      role: res.data.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    editDialog.value = false;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to update profile.";
  } finally {
    loading.value = false;
  }
};

const logOut = async () => {
  try {
    await AuthServices.logoutUser();
  } catch {
    // Clear the local session even if the API call fails.
  }
  Utils.removeItem("user");
  await router.push({ name: "login" });
};
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>My Lists</v-app-bar-title>
    <v-spacer />
    <v-menu>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-account-circle"
          variant="text"
          aria-label="Profile"
        />
      </template>
      <v-list>
        <v-list-item :title="fullName">
          <template #subtitle>
            <div>{{ sessionUser.username }}</div>
            <div>{{ sessionUser.email }}</div>
          </template>
        </v-list-item>
        <v-list-item>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openEditDialog">
            Edit Profile
          </v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn variant="text" @click="logOut">Log out</v-btn>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editDialog" max-width="480">
    <v-card>
      <v-card-item>
        <v-card-title>Edit Profile</v-card-title>
      </v-card-item>
      <v-card-text>
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-form ref="form" @submit.prevent="saveProfile">
          <v-text-field
            v-model="profile.fName"
            label="First name"
            :rules="firstNameRules"
            class="mb-2"
          />
          <v-text-field
            v-model="profile.lName"
            label="Last name"
            :rules="lastNameRules"
            class="mb-2"
          />
          <v-text-field
            v-model="profile.email"
            label="Email"
            :rules="emailRules"
            class="mb-2"
          />
          <v-text-field
            v-model="profile.username"
            label="Username"
            :rules="usernameRules"
            class="mb-2"
          />
          <v-text-field
            v-model="profile.password"
            label="New password"
            type="password"
            :rules="passwordRules"
            class="mb-2"
          />
          <v-text-field
            v-model="profile.confirmPassword"
            label="Confirm password"
            type="password"
            :rules="confirmPasswordRules"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="closeEditDialog">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="loading"
          @click="saveProfile"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
