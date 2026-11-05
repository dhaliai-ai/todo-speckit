/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import db from "../app/models/index.js";
import { registerUser, syncTestDatabase, validRegisterPayload } from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const res = await registerUser();

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        email: "jdoe@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "worker",
      });
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.password).toBeUndefined();

      const stored = await db.user.unscoped().findByPk(res.body.userId);
      expect(stored).not.toBeNull();
      expect(stored.password).not.toBe("password1");
      expect(await bcrypt.compare("password1", stored.password)).toBe(true);
    });

    it("User submits registration with missing email", async () => {
      const payload = validRegisterPayload();
      delete payload.email;

      const res = await request(app).post("/todo/register").send(payload);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is required." });
      expect(await db.user.count()).toBe(0);
    });

    it("User submits registration with password too short", async () => {
      const res = await registerUser({ password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password must be at least 8 characters." });
      expect(await db.user.count()).toBe(0);
    });

    it("User registers with a duplicate username", async () => {
      await registerUser();
      const res = await registerUser({ email: "other@example.com" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });
    });

    it("User registers with a duplicate email", async () => {
      await registerUser();
      const res = await registerUser({ username: "otheruser" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      await registerUser();

      const res = await request(app).post("/todo/login").send({
        username: "jdoe",
        password: "password1",
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        role: "worker",
      });
      expect(res.body.token).toEqual(expect.any(String));

      const sessions = await db.session.findAll({ where: { userId: res.body.userId } });
      expect(sessions.length).toBeGreaterThanOrEqual(1);
      expect(sessions.some((session) => session.token === res.body.token)).toBe(true);

      const secondLogin = await request(app).post("/todo/login").send({
        username: "jdoe",
        password: "password1",
      });
      expect(secondLogin.status).toBe(200);
      expect(secondLogin.body.token).toBe(res.body.token);
    });

    it("User signs in with invalid password", async () => {
      await registerUser();

      const res = await request(app).post("/todo/login").send({
        username: "jdoe",
        password: "wrongpass",
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Invalid username or password." });
    });

    it("User signs in with missing username", async () => {
      const res = await request(app).post("/todo/login").send({
        password: "password1",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is required." });
    });

    it("User signs in with missing password", async () => {
      const res = await request(app).post("/todo/login").send({
        username: "jdoe",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password is required." });
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const registered = await registerUser();
      const token = registered.body.token;

      const res = await request(app)
        .post("/todo/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const session = await db.session.findOne({ where: { userId: registered.body.userId } });
      expect(session.token).toBe("");

      const protectedRes = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${token}`);
      expect(protectedRes.status).toBe(401);
    });
  });
});
