import { Router } from "express";
import controller from "../controllers/todo.controller.js";
import { authenticate } from "../authorization/authorization.js";

export const nestedTodoRoutes = Router({ mergeParams: true });
nestedTodoRoutes.get("/", [authenticate], controller.findAllByList);
nestedTodoRoutes.post("/", [authenticate], controller.create);

export const todoItemRoutes = Router();
todoItemRoutes.put("/:id", [authenticate], controller.update);
todoItemRoutes.delete("/:id", [authenticate], controller.delete);
