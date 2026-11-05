/**
 * Feature 1 — User Authentication & Session Management
 * Feature 2 — Todo List Management
 * Spec: features/feature-1-user-auth.md, features/feature-2-todo-list-management.md
 */
import { beforeEach, describe, expect, it } from "vitest";
import router from "../src/router.js";
import Utils from "../src/config/utils.js";

const sessionUser = {
  userId: 1,
  username: "jdoe",
  fName: "Jane",
  token: "test-token",
  role: "worker",
};

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      Utils.setStore("user", sessionUser);
      await router.replace("/register");
      await router.replace("/login");
      await router.isReady();

      expect(router.currentRoute.value.name).toBe("home");
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      Utils.removeItem("user");
      await router.replace("/login");
      await router.replace("/");
      await router.isReady();

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-2.5 — Private lists only", () => {
    it("Unauthenticated user accesses the dashboard", async () => {
      Utils.removeItem("user");
      await router.replace("/login");
      await router.replace("/");
      await router.isReady();

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
