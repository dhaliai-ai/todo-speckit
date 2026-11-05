/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import { flushPromises } from "@vue/test-utils";
import { defineComponent } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MenuBar from "../src/components/MenuBar.vue";
import AuthServices from "../src/services/authServices.js";
import UserServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    registerUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const session = {
  userId: 1,
  username: "jdoe",
  email: "jdoe@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "worker",
  token: "test-token",
};

const profile = {
  id: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  role: "worker",
};

let mountedWrapper;

const MenuBarHost = defineComponent({
  components: { MenuBar },
  template: "<v-app><MenuBar /></v-app>",
});

async function mountMenuBar() {
  const result = await mountWithPlugins(MenuBarHost, { attachTo: document.body });
  mountedWrapper = result.wrapper;
  await flushPromises();
  return result;
}

function clickAria(label) {
  document.querySelector(`[aria-label="${label}"]`).dispatchEvent(
    new MouseEvent("click", { bubbles: true })
  );
}

function clickLastButton(label) {
  const buttons = Array.from(document.querySelectorAll("button")).filter(
    (item) => item.textContent.trim() === label
  );
  buttons.at(-1).dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

async function openProfileMenu() {
  clickAria("Profile");
  await flushPromises();
}

async function openEditDialog() {
  await openProfileMenu();
  clickLastButton("Edit Profile");
  await flushPromises();
}

async function setField(wrapper, label, value) {
  const field = wrapper
    .findAllComponents({ name: "VTextField" })
    .find((item) => item.props("label") === label);
  await field.setValue(value);
}

describe("Feature 4 — User Profile Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    Utils.setStore("user", session);
    UserServices.getUser.mockResolvedValue({ data: profile });
    UserServices.updateUser.mockResolvedValue({
      data: { ...profile, fName: "Janet", lName: "Doer", email: "janet@example.com", username: "janetd" },
    });
    AuthServices.logoutUser.mockResolvedValue({ data: { message: "Logged out." } });
  });

  afterEach(() => {
    mountedWrapper?.unmount();
    mountedWrapper = null;
    document.body.innerHTML = "";
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      await mountMenuBar();
      await openProfileMenu();

      expect(document.body.textContent).toContain("Jane Doe");
      expect(document.body.textContent).toContain("jdoe");
      expect(document.body.textContent).toContain("jdoe@example.com");
      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.body.textContent).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog();

      expect(document.body.textContent).toContain("Edit Profile");
      const firstName = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((item) => item.props("label") === "First name");
      expect(firstName.props("modelValue")).toBe("Jane");
    });

    it("User cancels the edit profile dialog", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog();
      await setField(wrapper, "First name", "Changed");
      clickLastButton("Cancel");
      await flushPromises();

      expect(UserServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Jane");
    });

    it("User saves profile changes", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog();
      await setField(wrapper, "First name", "Janet");
      await setField(wrapper, "Last name", "Doer");
      await setField(wrapper, "Email", "janet@example.com");
      await setField(wrapper, "Username", "janetd");
      clickLastButton("Save");
      await flushPromises();

      expect(UserServices.updateUser).toHaveBeenCalled();
      const stored = Utils.getStore("user");
      expect(stored.token).toBe("test-token");
      expect(stored.userId).toBe(1);
      expect(stored.fName).toBe("Janet");
      await openProfileMenu();
      expect(document.body.textContent).toContain("Janet Doer");
      expect(document.body.textContent).toContain("janetd");
      expect(document.body.textContent).toContain("janet@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog();
      await setField(wrapper, "Email", "notanemail");
      clickLastButton("Save");
      await flushPromises();

      expect(document.body.textContent).toContain("Enter a valid email address.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog();
      await setField(wrapper, "New password", "password1");
      await setField(wrapper, "Confirm password", "password2");
      clickLastButton("Save");
      await flushPromises();

      expect(document.body.textContent).toContain("Passwords do not match.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      const { wrapper } = await mountMenuBar();
      await openEditDialog();
      await setField(wrapper, "New password", "short");
      await setField(wrapper, "Confirm password", "short");
      clickLastButton("Save");
      await flushPromises();

      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      UserServices.updateUser.mockRejectedValue({
        response: { data: { message: "Username is already taken." } },
      });

      await mountMenuBar();
      await openEditDialog();
      clickLastButton("Save");
      await flushPromises();

      expect(document.body.textContent).toContain("Username is already taken.");
      expect(document.body.textContent).toContain("Edit Profile");
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      const { router } = await mountMenuBar();
      await openProfileMenu();
      clickLastButton("Log out");
      await flushPromises();
      await vi.waitUntil(() => router.currentRoute.value.name === "login");

      expect(AuthServices.logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      await mountMenuBar();

      const signOut = Array.from(document.querySelectorAll("button")).find(
        (item) => item.textContent.trim() === "Sign out"
      );
      expect(signOut).toBeUndefined();
      expect(document.body.textContent).not.toContain("Sign out");
    });
  });
});
