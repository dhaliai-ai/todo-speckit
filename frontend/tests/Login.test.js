/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { flushPromises } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "../src/views/Login.vue";
import AuthServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

async function fillField(wrapper, label, value) {
  const field = wrapper
    .findAllComponents({ name: "VTextField" })
    .find((item) => item.props("label") === label);
  await field.setValue(value);
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

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      AuthServices.loginUser.mockRejectedValue({
        response: { data: { message: "Invalid username or password." } },
      });

      const { wrapper } = await mountWithPlugins(Login);
      await fillField(wrapper, "Username", "jdoe");
      await fillField(wrapper, "Password", "wrongpass");
      await submit(wrapper);

      expect(AuthServices.loginUser).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Invalid username or password.");
      expect(wrapper.findComponent({ name: "VAlert" }).exists()).toBe(true);
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      await fillField(wrapper, "Password", "password1");
      await submit(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      await fillField(wrapper, "Username", "jdoe");
      await submit(wrapper);

      expect(wrapper.text()).toContain("Password is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });
  });
});
