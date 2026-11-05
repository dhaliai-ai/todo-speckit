/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Register from "../src/views/Register.vue";
import AuthServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const validAccount = {
  "First name": "Jane",
  "Last name": "Doe",
  Email: "jane@example.com",
  Username: "jdoe",
  Password: "password1",
  "Confirm password": "password1",
};

async function fillField(wrapper, label, value) {
  const field = wrapper
    .findAllComponents({ name: "VTextField" })
    .find((item) => item.props("label") === label);
  await field.setValue(value);
}

async function fillForm(wrapper, values) {
  for (const [label, value] of Object.entries(values)) {
    await fillField(wrapper, label, value);
  }
}

async function submit(wrapper) {
  await wrapper.get("form").trigger("submit.prevent");
  await flushPromises();
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillForm(wrapper, { ...validAccount, Email: "notanemail" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillForm(wrapper, { ...validAccount, Username: "" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillForm(wrapper, {
        ...validAccount,
        Password: "short",
        "Confirm password": "short",
      });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillForm(wrapper, {
        ...validAccount,
        Password: "password1",
        "Confirm password": "password2",
      });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });
  });
});
