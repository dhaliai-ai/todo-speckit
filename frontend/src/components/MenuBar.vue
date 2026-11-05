<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = computed(() => Utils.getStore("user") || {});
const displayName = computed(() => {
  const { fName, lName, username } = user.value;
  const fullName = [fName, lName].filter(Boolean).join(" ");
  return fullName || username || "";
});

const signOut = async () => {
  try {
    await AuthServices.logoutUser();
  } catch {
    // Clear the local session even if the API call fails.
  }
  Utils.removeItem("user");
  router.push({ name: "login" });
};
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>My Lists</v-app-bar-title>
    <v-spacer />
    <span class="me-4">{{ displayName }}</span>
    <v-btn variant="text" class="oc-cta" @click="signOut">Sign out</v-btn>
  </v-app-bar>
</template>
