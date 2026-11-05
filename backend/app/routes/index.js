import { Router } from "express";
import authRoutes from "./auth.routes.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/", authRoutes);

// Feature 1 Gherkin requires an authenticated GET /todo/lists.
// Lists CRUD is Feature 2 — this stub returns an empty array only.
router.get("/lists", [authenticate], (_req, res) => {
  res.status(200).send([]);
});

export default router;
