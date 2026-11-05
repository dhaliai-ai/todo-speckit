/**
 * Feature 2 — Todo List Management
 * Feature 3 — Todo List Item Management
 * Feature 5 — Todo Due Date
 * Spec: features/feature-2-todo-list-management.md, features/feature-3-todo-list-item-management.md, features/feature-5-todo-due-date.md
 */
import { flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../src/views/Dashboard.vue";
import ListServices from "../src/services/listServices.js";
import TodoServices from "../src/services/todoServices.js";
import { formatDueDate } from "../src/config/validation.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 1 };
const personal = { id: 2, name: "Personal", userId: 1 };
const work = { id: 3, name: "Work", userId: 1 };

let mountedWrapper;

async function mountDashboard() {
  const result = await mountWithPlugins(Dashboard, {
    attachTo: document.body,
  });
  mountedWrapper = result.wrapper;
  await flushPromises();
  return result;
}

function clickLastButton(label) {
  const buttons = Array.from(document.querySelectorAll("button")).filter(
    (item) => item.textContent.trim() === label
  );
  buttons.at(-1).dispatchEvent(new MouseEvent("click", { bubbles: true }));
  return Promise.resolve();
}

function clickDomButton(label) {
  const buttons = Array.from(document.querySelectorAll("button"));
  const exact = buttons.find((item) => item.textContent.trim() === label);
  const partial = buttons.find((item) => item.textContent.includes(label));
  const button = exact || partial;
  button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function clickButton(wrapper, label) {
  const wrapperButtons = wrapper.findAll("button");
  const exact = wrapperButtons.find((item) => item.text().trim() === label);
  const partial = wrapperButtons.find((item) => item.text().includes(label));
  const fromWrapper = exact || partial;
  if (fromWrapper) {
    return fromWrapper.trigger("click");
  }

  clickDomButton(label);
  return Promise.resolve();
}

function itemsButtonFor(wrapper, listName) {
  const row = wrapper.findAllComponents({ name: "VListItem" }).find((item) =>
    item.text().includes(listName)
  );
  return row.find('[aria-label="Items"]');
}

async function openItems(wrapper, listName) {
  await itemsButtonFor(wrapper, listName).trigger("click");
  await flushPromises();
}

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [] });
    TodoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    mountedWrapper?.unmount();
    mountedWrapper = null;
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

describe("Feature 3 — Todo List Item Management", () => {
  const milk = { id: 10, listId: 1, title: "Buy milk", completed: false, userId: 1 };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [groceries] });
    TodoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    mountedWrapper?.unmount();
    mountedWrapper = null;
    document.body.innerHTML = "";
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [milk] });
      TodoServices.createTodo.mockResolvedValue({ data: milk });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");
      await clickButton(wrapper, "+ Add Item");
      await flushPromises();

      const titleField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((item) => item.props("label") === "Todo title");
      await titleField.setValue("Buy milk");
      await clickLastButton("Add");
      await flushPromises();

      expect(TodoServices.createTodo).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(document.body.textContent).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");
      await clickButton(wrapper, "+ Add Item");
      await flushPromises();
      await clickLastButton("Add");
      await flushPromises();

      expect(document.body.textContent).toContain("Todo title is required.");
      expect(TodoServices.createTodo).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      const { wrapper } = await mountDashboard();

      expect(wrapper.text()).not.toContain("+ Add Item");
      expect(document.body.textContent).not.toContain("+ Add Item");
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      ListServices.getLists.mockResolvedValue({ data: [personal] });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Personal");

      expect(document.body.textContent).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      ListServices.getLists.mockResolvedValue({ data: [personal, work] });
      TodoServices.getTodos.mockImplementation((listId) => {
        if (listId === 2) {
          return Promise.resolve({
            data: [{ id: 21, listId: 2, title: "Call mom", completed: false, userId: 1 }],
          });
        }
        return Promise.resolve({
          data: [
            { id: 31, listId: 3, title: "Email client", completed: false, userId: 1 },
            { id: 32, listId: 3, title: "Write report", completed: false, userId: 1 },
          ],
        });
      });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Personal");
      expect(document.body.textContent).toContain("Call mom");
      expect(document.body.textContent).not.toContain("Email client");

      await clickButton(wrapper, "Close");
      await flushPromises();
      await openItems(wrapper, "Work");

      expect(document.body.textContent).toContain("Email client");
      expect(document.body.textContent).toContain("Write report");
      expect(document.body.textContent).not.toContain("Call mom");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [milk] })
        .mockResolvedValueOnce({ data: [{ ...milk, completed: true }] });
      TodoServices.updateTodo.mockResolvedValue({ data: { ...milk, completed: true } });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");
      const checkbox = wrapper.findAllComponents({ name: "VCheckboxBtn" }).at(0);
      await checkbox.vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { completed: true });
      expect(document.body.querySelector(".text-decoration-line-through")).not.toBeNull();
    });

    it("User marks a completed todo as incomplete", async () => {
      const done = { ...milk, completed: true };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [done] })
        .mockResolvedValueOnce({ data: [milk] });
      TodoServices.updateTodo.mockResolvedValue({ data: milk });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");
      expect(document.body.querySelector(".text-decoration-line-through")).not.toBeNull();
      const checkbox = wrapper.findAllComponents({ name: "VCheckboxBtn" }).at(0);
      await checkbox.vm.$emit("update:modelValue", false);
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { completed: false });
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [milk] })
        .mockResolvedValueOnce({
          data: [{ ...milk, title: "Buy oat milk" }],
        });
      TodoServices.updateTodo.mockResolvedValue({
        data: { ...milk, title: "Buy oat milk" },
      });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");
      document.querySelector('[aria-label="Edit todo"]').dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
      await flushPromises();

      const titleField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((item) => item.props("label") === "Todo title");
      await titleField.setValue("Buy oat milk");
      await clickLastButton("Save");
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy oat milk",
        dueDate: null,
      });
      expect(document.body.textContent).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [milk] })
        .mockResolvedValueOnce({ data: [] });
      TodoServices.deleteTodo.mockResolvedValue({ data: milk });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");
      document.querySelector('[aria-label="Delete todo"]').dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
      await flushPromises();
      await clickLastButton("Delete");
      await flushPromises();

      expect(TodoServices.deleteTodo).toHaveBeenCalledWith(10);
      expect(document.body.textContent).toContain("No todos in this list yet.");
    });
  });
});

function localIsoDate(daysFromToday) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("Feature 5 — Todo Due Date", () => {
  const milk = { id: 10, listId: 1, title: "Buy milk", completed: false, userId: 1, dueDate: null };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [groceries] });
    TodoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    mountedWrapper?.unmount();
    mountedWrapper = null;
    document.body.innerHTML = "";
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const withDate = { ...milk, dueDate: "2026-07-15" };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [withDate] });
      TodoServices.createTodo.mockResolvedValue({ data: withDate });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");
      await clickButton(wrapper, "+ Add Item");
      await flushPromises();

      const titleField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((item) => item.props("label") === "Todo title");
      const dueField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((item) => item.props("label") === "Due date");
      await titleField.setValue("Buy milk");
      await dueField.setValue("2026-07-15");
      await clickLastButton("Add");
      await flushPromises();

      expect(TodoServices.createTodo).toHaveBeenCalledWith(1, {
        title: "Buy milk",
        dueDate: "2026-07-15",
      });
      expect(document.body.textContent).toContain(formatDueDate("2026-07-15"));
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      const updated = { ...milk, dueDate: "2026-07-20" };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [milk] })
        .mockResolvedValueOnce({ data: [updated] });
      TodoServices.updateTodo.mockResolvedValue({ data: updated });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");
      document.querySelector('[aria-label="Edit todo"]').dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
      await flushPromises();

      const dueField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((item) => item.props("label") === "Due date");
      await dueField.setValue("2026-07-20");
      await clickLastButton("Save");
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: "2026-07-20",
      });
      expect(document.body.textContent).toContain(formatDueDate("2026-07-20"));
    });

    it("User clears a due date when editing a todo", async () => {
      const withDate = { ...milk, dueDate: "2026-07-20" };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [withDate] })
        .mockResolvedValueOnce({ data: [milk] });
      TodoServices.updateTodo.mockResolvedValue({ data: milk });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");
      expect(document.body.textContent).toContain(formatDueDate("2026-07-20"));

      document.querySelector('[aria-label="Edit todo"]').dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
      await flushPromises();

      const dueField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((item) => item.props("label") === "Due date");
      await dueField.setValue("");
      await clickLastButton("Save");
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: null,
      });
      expect(document.body.textContent).not.toContain(formatDueDate("2026-07-20"));
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      const yesterday = localIsoDate(-1);
      TodoServices.getTodos.mockResolvedValue({
        data: [{ ...milk, dueDate: yesterday, completed: false }],
      });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");

      const overdue = document.querySelector(".text-error");
      expect(overdue).not.toBeNull();
      expect(overdue.textContent).toContain(formatDueDate(yesterday));
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      const yesterday = localIsoDate(-1);
      TodoServices.getTodos.mockResolvedValue({
        data: [{ ...milk, dueDate: yesterday, completed: true }],
      });

      const { wrapper } = await mountDashboard();
      await openItems(wrapper, "Groceries");

      expect(document.body.textContent).toContain(formatDueDate(yesterday));
      expect(document.querySelector(".text-error")).toBeNull();
    });
  });
});
