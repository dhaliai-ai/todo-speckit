<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const account = ref({
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
  (value) => !!value || "Password is required.",
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => value === account.value.password || "Passwords do not match.",
];

const createAccount = async () => {
  errorMessage.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const res = await AuthServices.registerUser({
      fName: account.value.fName.trim(),
      lName: account.value.lName.trim(),
      email: account.value.email.trim(),
      username: account.value.username.trim(),
      password: account.value.password,
    });
    Utils.setStore("user", res.data);
    router.push({ name: "home" });
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to create account.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height py-10" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-2" elevation="4">
          <v-card-item>
            <v-card-title class="text-h5">Create account</v-card-title>
            <v-card-subtitle>Register to manage your private todos</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <v-alert v-if="errorMessage" type="error" class="mb-4">
              {{ errorMessage }}
            </v-alert>
            <v-form ref="form" @submit.prevent="createAccount">
              <v-text-field
                v-model="account.fName"
                label="First name"
                autocomplete="given-name"
                :rules="firstNameRules"
                class="mb-2"
              />
              <v-text-field
                v-model="account.lName"
                label="Last name"
                autocomplete="family-name"
                :rules="lastNameRules"
                class="mb-2"
              />
              <v-text-field
                v-model="account.email"
                label="Email"
                type="email"
                autocomplete="email"
                :rules="emailRules"
                class="mb-2"
              />
              <v-text-field
                v-model="account.username"
                label="Username"
                autocomplete="username"
                :rules="usernameRules"
                class="mb-2"
              />
              <v-text-field
                v-model="account.password"
                label="Password"
                type="password"
                autocomplete="new-password"
                :rules="passwordRules"
                class="mb-2"
              />
              <v-text-field
                v-model="account.confirmPassword"
                label="Confirm password"
                type="password"
                autocomplete="new-password"
                :rules="confirmPasswordRules"
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
                Create account
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-btn variant="text" color="primary" :to="{ name: 'login' }">
              Sign in
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
