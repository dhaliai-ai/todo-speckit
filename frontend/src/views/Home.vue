<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = computed(() => Utils.getStore("user") || {});
const firstName = computed(() => user.value.fName || "there");

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
  <v-container class="py-10">
    <v-row>
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-4" elevation="4">
          <v-card-item>
            <v-card-title class="text-h5">Welcome, {{ firstName }}</v-card-title>
            <v-card-subtitle>You are signed in.</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            Your todo lists will appear here in a later feature.
          </v-card-text>
          <v-card-actions>
            <v-btn color="secondary" variant="outlined" class="oc-cta" @click="signOut">
              Sign out
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
