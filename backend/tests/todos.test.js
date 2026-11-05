/**
 * Feature 3 — Todo List Item Management
 * Feature 5 — Todo Due Date
 * Spec: features/feature-3-todo-list-item-management.md, features/feature-5-todo-due-date.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  authHeader,
  createList,
  createTodo,
  registerUser,
  syncTestDatabase,
} from "./helpers.js";

const registerOtherUser = () =>
  registerUser({
    username: "jsmith",
    email: "jsmith@example.com",
    fName: "John",
    lName: "Smith",
  });

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");

      const res = await createTodo(user.body.token, list.body.id, "Buy milk");

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        title: "Buy milk",
        completed: false,
        userId: user.body.userId,
        listId: list.body.id,
      });
    });

    it("User adds a todo with an empty title", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");

      const res = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader(user.body.token))
        .send({ title: "   " });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Todo title is required." });
      expect(await db.todo.count()).toBe(0);
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const userA = await registerUser();
      const userB = await registerOtherUser();
      const listA = await createList(userA.body.token, "Work");
      const listB = await createList(userB.body.token, "Work");
      await createTodo(userA.body.token, listA.body.id, "My task");
      await createTodo(userB.body.token, listB.body.id, "Their task");

      const res = await request(app)
        .get(`/todo/lists/${listA.body.id}/todos`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((todo) => todo.title)).toEqual(["My task"]);
      expect(res.body.some((todo) => todo.title === "Their task")).toBe(false);
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const todo = await createTodo(user.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(user.body.token))
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const todo = await createTodo(user.body.token, list.body.id, "Buy milk");
      await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(user.body.token))
        .send({ completed: true });

      const res = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(user.body.token))
        .send({ completed: false });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const todo = await createTodo(user.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(user.body.token))
        .send({ title: "Buy oat milk" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const todo = await createTodo(user.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .delete(`/todo/todos/${todo.body.id}`)
        .set(authHeader(user.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await db.todo.findByPk(todo.body.id)).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const userA = await registerUser();
      const userB = await registerOtherUser();
      const listB = await createList(userB.body.token, "Secret");
      await createTodo(userB.body.token, listB.body.id, "Hidden task");

      const res = await request(app)
        .get(`/todo/lists/${listB.body.id}/todos`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.body.id} not found.`,
      });
      expect(JSON.stringify(res.body)).not.toContain("Hidden task");
    });

    it("User attempts to add a todo to another user's list", async () => {
      const userA = await registerUser();
      const userB = await registerOtherUser();
      const listB = await createList(userB.body.token, "Secret");

      const res = await request(app)
        .post(`/todo/lists/${listB.body.id}/todos`)
        .set(authHeader(userA.body.token))
        .send({ title: "Intruder task" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.body.id} not found.`,
      });
      expect(await db.todo.count({ where: { listId: listB.body.id } })).toBe(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const userA = await registerUser();
      const userB = await registerOtherUser();
      const listB = await createList(userB.body.token, "Secret");
      const todoB = await createTodo(userB.body.token, listB.body.id, "Hidden task");

      const res = await request(app)
        .put(`/todo/todos/${todoB.body.id}`)
        .set(authHeader(userA.body.token))
        .send({ title: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Todo with id=${todoB.body.id} not found.`,
      });
      const stored = await db.todo.findByPk(todoB.body.id);
      expect(stored.title).toBe("Hidden task");
    });

    it("User attempts to delete another user's todo", async () => {
      const userA = await registerUser();
      const userB = await registerOtherUser();
      const listB = await createList(userB.body.token, "Secret");
      const todoB = await createTodo(userB.body.token, listB.body.id, "Hidden task");

      const res = await request(app)
        .delete(`/todo/todos/${todoB.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Todo with id=${todoB.body.id} not found.`,
      });
      expect(await db.todo.findByPk(todoB.body.id)).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const userA = await registerUser();
      const userB = await registerOtherUser();
      const listA = await createList(userA.body.token, "Groceries");

      const res = await request(app)
        .post(`/todo/lists/${listA.body.id}/todos`)
        .set(authHeader(userA.body.token))
        .send({ title: "Buy milk", userId: userB.body.userId });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(userB.body.userId);
      const stored = await db.todo.findByPk(res.body.id);
      expect(stored.userId).toBe(userA.body.userId);
    });

    it("Unauthenticated API request for todos", async () => {
      const res = await request(app).get("/todo/lists/1/todos");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const milk = await createTodo(user.body.token, list.body.id, "Buy milk");
      const eggs = await createTodo(user.body.token, list.body.id, "Buy eggs");

      const res = await request(app)
        .delete(`/todo/lists/${list.body.id}`)
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(await db.todo.findByPk(milk.body.id)).toBeNull();
      expect(await db.todo.findByPk(eggs.body.id)).toBeNull();
    });
  });
});

describe("Feature 5 — Todo Due Date", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");

      const res = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader(user.body.token))
        .send({ title: "Buy milk", dueDate: "2026-07-15" });

      expect(res.status).toBe(201);
      expect(res.body.dueDate).toBe("2026-07-15");
      expect(res.body.title).toBe("Buy milk");
    });

    it("User adds a todo without a due date", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");

      const res = await createTodo(user.body.token, list.body.id, "Buy milk");

      expect(res.status).toBe(201);
      expect(res.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on create", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");

      const res = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader(user.body.token))
        .send({ title: "Task", dueDate: "not-a-date" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Due date must be a valid date in YYYY-MM-DD format.",
      });
      expect(await db.todo.count()).toBe(0);
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const milk = await createTodo(user.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .put(`/todo/todos/${milk.body.id}`)
        .set(authHeader(user.body.token))
        .send({ dueDate: "2026-07-20" });

      expect(res.status).toBe(200);
      expect(res.body.dueDate).toBe("2026-07-20");
    });

    it("User clears a due date when editing a todo", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const milk = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader(user.body.token))
        .send({ title: "Buy milk", dueDate: "2026-07-20" });

      const res = await request(app)
        .put(`/todo/todos/${milk.body.id}`)
        .set(authHeader(user.body.token))
        .send({ dueDate: null });

      expect(res.status).toBe(200);
      expect(res.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on update", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const milk = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader(user.body.token))
        .send({ title: "Buy milk", dueDate: "2026-07-15" });

      const res = await request(app)
        .put(`/todo/todos/${milk.body.id}`)
        .set(authHeader(user.body.token))
        .send({ dueDate: "2026-99-99" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Due date must be a valid date in YYYY-MM-DD format.",
      });

      const stored = await db.todo.findByPk(milk.body.id);
      expect(stored.dueDate).toBe("2026-07-15");
    });

    it("User cannot set due date on another user's todo", async () => {
      const owner = await registerUser();
      const other = await registerOtherUser();
      const list = await createList(owner.body.token, "Groceries");
      const milk = await createTodo(owner.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .put(`/todo/todos/${milk.body.id}`)
        .set(authHeader(other.body.token))
        .send({ dueDate: "2026-07-15" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Todo with id=${milk.body.id} not found.`,
      });

      const stored = await db.todo.findByPk(milk.body.id);
      expect(stored.dueDate).toBeNull();
    });

    it("Omitting dueDate on update leaves the existing value", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const milk = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader(user.body.token))
        .send({ title: "Buy milk", dueDate: "2026-07-15" });

      const res = await request(app)
        .put(`/todo/todos/${milk.body.id}`)
        .set(authHeader(user.body.token))
        .send({ title: "Buy oat milk" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Buy oat milk");
      expect(res.body.dueDate).toBe("2026-07-15");
    });

    it("Empty string dueDate is stored as null", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");

      const created = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader(user.body.token))
        .send({ title: "Buy milk", dueDate: "" });

      expect(created.status).toBe(201);
      expect(created.body.dueDate).toBeNull();

      const withDate = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader(user.body.token))
        .send({ title: "Buy eggs", dueDate: "2026-07-15" });

      const cleared = await request(app)
        .put(`/todo/todos/${withDate.body.id}`)
        .set(authHeader(user.body.token))
        .send({ dueDate: "   " });

      expect(cleared.status).toBe(200);
      expect(cleared.body.dueDate).toBeNull();
    });

    it("API rejects an impossible calendar date", async () => {
      const user = await registerUser();
      const list = await createList(user.body.token, "Groceries");

      const res = await request(app)
        .post(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader(user.body.token))
        .send({ title: "Task", dueDate: "2026-02-31" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Due date must be a valid date in YYYY-MM-DD format.",
      });
    });
  });
});
