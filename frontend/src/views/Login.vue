<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const credentials = ref({
  username: "",
  password: "",
});

const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [(value) => !!value || "Password is required."];

const signIn = async () => {
  errorMessage.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const res = await AuthServices.loginUser({
      username: credentials.value.username.trim(),
      password: credentials.value.password,
    });
    Utils.setStore("user", res.data);
    router.push({ name: "home" });
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to sign in.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-2" elevation="4">
          <v-card-item>
            <v-card-title class="text-h5">Sign in</v-card-title>
            <v-card-subtitle>Use your username and password</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <v-alert v-if="errorMessage" type="error" class="mb-4">
              {{ errorMessage }}
            </v-alert>
            <v-form ref="form" @submit.prevent="signIn">
              <v-text-field
                v-model="credentials.username"
                label="Username"
                autocomplete="username"
                :rules="usernameRules"
                class="mb-2"
              />
              <v-text-field
                v-model="credentials.password"
                label="Password"
                type="password"
                autocomplete="current-password"
                :rules="passwordRules"
                class="mb-2"
              />
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                class="oc-cta"
                block
                :loading="loading"
              >
                Sign in
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-btn variant="text" color="primary" :to="{ name: 'register' }">
              Create an account
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
