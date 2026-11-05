import db from "../models/index.js";
import logger from "../config/logger.js";

const Session = db.session;
const User = db.user;
const List = db.list;
const Todo = db.todo;

export const parsePositiveIntId = (value) => {
  if (!/^[1-9]\d*$/.test(String(value))) {
    return NaN;
  }

  return Number(value);
};

export const getAccessibleListOrNull = async (req, listId) => {
  const row = await List.findOne({
    where: { id: listId, userId: req.user.id },
  });

  return row ?? null;
};

export const getAccessibleTodoOrNull = async (req, todoId) => {
  const todo = await Todo.findOne({
    where: { id: todoId, userId: req.user.id },
  });

  if (!todo) {
    return null;
  }

  const list = await getAccessibleListOrNull(req, todo.listId);
  if (!list) {
    return null;
  }

  return todo;
};

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || req.headers.Authorization || "";
    const [scheme, token] = String(header).split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).send({ message: "Unauthorized! No token provided." });
    }

    const session = await Session.findOne({
      where: { token },
      include: [{ model: User, as: "user" }],
    });

    if (!session || !session.user) {
      return res.status(401).send({ message: "Unauthorized! Invalid token." });
    }

    if (new Date(session.expirationDate) < new Date()) {
      return res.status(401).send({ message: "Unauthorized! Token expired." });
    }

    req.user = { id: session.user.id, role: session.user.role };
    return next();
  } catch (err) {
    logger.error(`authenticate failed: ${err.message}`);
    return res.status(401).send({ message: "Unauthorized! Invalid token." });
  }
};
