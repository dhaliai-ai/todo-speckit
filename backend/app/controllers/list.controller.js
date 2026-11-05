import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull, parsePositiveIntId } from "../authorization/authorization.js";

const List = db.list;
const exports = {};

const validateListName = (name) => {
  if (name == null || String(name).trim() === "") {
    return { error: "List name is required." };
  }

  const trimmed = String(name).trim();
  if (trimmed.length > 100) {
    return { error: "List name must be 100 characters or fewer." };
  }

  return { name: trimmed };
};

const requireListId = (req, res) => {
  const listId = parsePositiveIntId(req.params.listId);
  if (Number.isNaN(listId)) {
    res.status(400).send({ message: "List id must be a positive integer." });
    return null;
  }

  return listId;
};

exports.findAll = async (req, res) => {
  try {
    const lists = await List.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });
    return res.status(200).send(lists);
  } catch (err) {
    logger.error(`findAll lists failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to retrieve lists." });
  }
};

exports.create = async (req, res) => {
  const validated = validateListName(req.body?.name);
  if (validated.error) {
    return res.status(400).send({ message: validated.error });
  }

  try {
    const list = await List.create({
      name: validated.name,
      userId: req.user.id,
    });
    return res.status(201).send(list);
  } catch (err) {
    logger.error(`create list failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create list." });
  }
};

exports.update = async (req, res) => {
  const listId = requireListId(req, res);
  if (listId == null) {
    return undefined;
  }

  const validated = validateListName(req.body?.name);
  if (validated.error) {
    return res.status(400).send({ message: validated.error });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    list.name = validated.name;
    await list.save();
    return res.status(200).send(list);
  } catch (err) {
    logger.error(`update list failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update list." });
  }
};

exports.delete = async (req, res) => {
  const listId = requireListId(req, res);
  if (listId == null) {
    return undefined;
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    await list.destroy();
    return res.status(200).send(list);
  } catch (err) {
    logger.error(`delete list failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete list." });
  }
};

export default exports;
