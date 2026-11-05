import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
  parsePositiveIntId,
} from "../authorization/authorization.js";

const Todo = db.todo;
const exports = {};

const DUE_DATE_INVALID = "Due date must be a valid date in YYYY-MM-DD format.";
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const validateTitle = (title) => {
  if (title == null || String(title).trim() === "") {
    return { error: "Todo title is required." };
  }

  const trimmed = String(title).trim();
  if (trimmed.length > 255) {
    return { error: "Todo title must be 255 characters or fewer." };
  }

  return { title: trimmed };
};

const parseDueDateField = (body) => {
  if (body == null || !Object.prototype.hasOwnProperty.call(body, "dueDate")) {
    return { omitted: true };
  }

  const value = body.dueDate;
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return { dueDate: null };
  }

  if (typeof value !== "string") {
    return { error: DUE_DATE_INVALID };
  }

  const trimmed = value.trim();
  if (!DATE_ONLY_REGEX.test(trimmed)) {
    return { error: DUE_DATE_INVALID };
  }

  const [year, month, day] = trimmed.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { error: DUE_DATE_INVALID };
  }

  return { dueDate: trimmed };
};

const requirePositiveId = (value, label, res) => {
  const id = parsePositiveIntId(value);
  if (Number.isNaN(id)) {
    res.status(400).send({ message: `${label} must be a positive integer.` });
    return null;
  }

  return id;
};

exports.findAllByList = async (req, res) => {
  const listId = requirePositiveId(req.params.listId, "List id", res);
  if (listId == null) {
    return undefined;
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todos = await Todo.findAll({
      where: { listId, userId: req.user.id },
      order: [
        ["completed", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    return res.status(200).send(todos);
  } catch (err) {
    logger.error(`findAllByList todos failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to retrieve todos." });
  }
};

exports.create = async (req, res) => {
  const listId = requirePositiveId(req.params.listId, "List id", res);
  if (listId == null) {
    return undefined;
  }

  const validated = validateTitle(req.body?.title);
  if (validated.error) {
    return res.status(400).send({ message: validated.error });
  }

  const dueDateField = parseDueDateField(req.body);
  if (dueDateField.error) {
    return res.status(400).send({ message: dueDateField.error });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todo = await Todo.create({
      title: validated.title,
      listId: list.id,
      userId: req.user.id,
      completed: false,
      dueDate: dueDateField.omitted ? null : dueDateField.dueDate,
    });
    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`create todo failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create todo." });
  }
};

exports.update = async (req, res) => {
  const todoId = requirePositiveId(req.params.id, "Todo id", res);
  if (todoId == null) {
    return undefined;
  }

  const { title, completed } = req.body ?? {};
  const dueDateField = parseDueDateField(req.body);
  if (dueDateField.error) {
    return res.status(400).send({ message: dueDateField.error });
  }

  if (title === undefined && completed === undefined && dueDateField.omitted) {
    return res.status(400).send({ message: "Title or completed is required." });
  }

  if (completed !== undefined && typeof completed !== "boolean") {
    return res.status(400).send({ message: "Completed must be a boolean." });
  }

  let nextTitle;
  if (title !== undefined) {
    const validated = validateTitle(title);
    if (validated.error) {
      return res.status(400).send({ message: validated.error });
    }
    nextTitle = validated.title;
  }

  try {
    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    if (nextTitle !== undefined) {
      todo.title = nextTitle;
    }
    if (completed !== undefined) {
      todo.completed = completed;
    }
    if (!dueDateField.omitted) {
      todo.dueDate = dueDateField.dueDate;
    }

    await todo.save();
    return res.status(200).send(todo);
  } catch (err) {
    logger.error(`update todo failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update todo." });
  }
};

exports.delete = async (req, res) => {
  const todoId = requirePositiveId(req.params.id, "Todo id", res);
  if (todoId == null) {
    return undefined;
  }

  try {
    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    await todo.destroy();
    return res.status(200).send(todo);
  } catch (err) {
    logger.error(`delete todo failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete todo." });
  }
};

export default exports;
