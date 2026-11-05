import { Router } from "express";
import authRoutes from "./auth.routes.js";
import listRoutes from "./list.routes.js";
import { nestedTodoRoutes, todoItemRoutes } from "./todo.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/", authRoutes);
router.use("/lists/:listId/todos", nestedTodoRoutes);
router.use("/lists", listRoutes);
router.use("/todos", todoItemRoutes);
router.use("/users", userRoutes);

export default router;
