/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { registerUser, syncTestDatabase } from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const registered = await registerUser();

      const res = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${registered.body.token}`);

      expect(res.status).toBe(200);
    });

    it("Protected API request succeeds with a valid session", async () => {
      const userA = await registerUser();
      await registerUser({
        username: "jsmith",
        email: "jsmith@example.com",
        fName: "John",
        lName: "Smith",
      });

      const res = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${userA.body.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual([]);
    });

    it("Expired or invalid session token", async () => {
      const registered = await registerUser();
      const session = await db.session.findOne({
        where: { token: registered.body.token },
      });
      session.expirationDate = new Date(Date.now() - 1000);
      await session.save();

      const res = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${registered.body.token}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
