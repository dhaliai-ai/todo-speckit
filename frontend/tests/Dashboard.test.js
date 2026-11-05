/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import { flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../src/views/Dashboard.vue";
import ListServices from "../src/services/listServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 1 };
const personal = { id: 2, name: "Personal", userId: 1 };
const work = { id: 3, name: "Work", userId: 1 };

async function mountDashboard() {
  const result = await mountWithPlugins(Dashboard, {
    attachTo: document.body,
  });
  await flushPromises();
  return result;
}

function clickButton(wrapper, label) {
  const fromWrapper = wrapper.findAll("button").find((item) => item.text().includes(label));
  if (fromWrapper) {
    return fromWrapper.trigger("click");
  }

  const fromBody = Array.from(document.querySelectorAll("button")).find((item) =>
    item.textContent.includes(label)
  );
  fromBody.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  return Promise.resolve();
}

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [groceries] });
      ListServices.createList.mockResolvedValue({ data: groceries });

      const { wrapper } = await mountDashboard();
      await clickButton(wrapper, "+ New List");
      await flushPromises();

      const nameField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((item) => item.props("label") === "List name");
      await nameField.setValue("Groceries");
      await clickButton(wrapper, "Create");
      await flushPromises();

      expect(ListServices.createList).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.findComponent({ name: "VDialog" }).props("modelValue")).toBe(false);
    });

    it("User creates a list with an empty name", async () => {
      const { wrapper } = await mountDashboard();
      await clickButton(wrapper, "+ New List");
      await flushPromises();
      await clickButton(wrapper, "Create");
      await flushPromises();

      expect(document.body.textContent).toContain("List name is required.");
      expect(ListServices.createList).not.toHaveBeenCalled();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      ListServices.getLists.mockResolvedValue({ data: [personal, work] });

      const { wrapper } = await mountDashboard();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });

    it("User has no lists", async () => {
      const { wrapper } = await mountDashboard();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      ListServices.getLists.mockResolvedValue({ data: [groceries] });

      const { wrapper } = await mountDashboard();

      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [{ ...groceries, name: "Shopping" }] });
      ListServices.updateList.mockResolvedValue({
        data: { ...groceries, name: "Shopping" },
      });

      const { wrapper } = await mountDashboard();
      await wrapper.find('[aria-label="Edit list"]').trigger("click");
      await flushPromises();

      const nameField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((item) => item.props("label") === "List name");
      await nameField.setValue("Shopping");
      await clickButton(wrapper, "Save");
      await flushPromises();

      expect(ListServices.updateList).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [] });
      ListServices.deleteList.mockResolvedValue({ data: groceries });

      const { wrapper } = await mountDashboard();
      await wrapper.find('[aria-label="Delete list"]').trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Delete");
      await flushPromises();

      expect(ListServices.deleteList).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Groceries");
      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });
});
