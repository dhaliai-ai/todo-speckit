import bcrypt from "bcryptjs";
import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleUserOrNull,
  parsePositiveIntId,
} from "../authorization/authorization.js";

const User = db.user;
const { Op } = db.Sequelize;
const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const exports = {};

const isBlank = (value) => value == null || String(value).trim() === "";

const requireUserId = (req, res) => {
  const userId = parsePositiveIntId(req.params.id);
  if (Number.isNaN(userId)) {
    res.status(400).send({ message: "User id must be a positive integer." });
    return null;
  }

  return userId;
};

const profilePayload = (user) => ({
  id: user.id,
  fName: user.fName,
  lName: user.lName,
  email: user.email,
  username: user.username,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

exports.findOne = async (req, res) => {
  const userId = requireUserId(req, res);
  if (userId == null) {
    return undefined;
  }

  try {
    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    return res.status(200).send(profilePayload(user));
  } catch (err) {
    logger.error(`findOne user failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to retrieve profile." });
  }
};

exports.update = async (req, res) => {
  const userId = requireUserId(req, res);
  if (userId == null) {
    return undefined;
  }

  const { fName, lName, email, username, password } = req.body ?? {};
  const nextPassword = isBlank(password) ? null : String(password);

  if (nextPassword && nextPassword.length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }

  if (isBlank(fName)) {
    return res.status(400).send({ message: "First name is required." });
  }
  if (isBlank(lName)) {
    return res.status(400).send({ message: "Last name is required." });
  }
  if (isBlank(email)) {
    return res.status(400).send({ message: "Email is required." });
  }
  if (!EMAIL_REGEX.test(String(email).trim())) {
    return res.status(400).send({ message: "Enter a valid email address." });
  }
  if (isBlank(username)) {
    return res.status(400).send({ message: "Username is required." });
  }

  const trimmedFName = String(fName).trim();
  const trimmedLName = String(lName).trim();
  const trimmedEmail = String(email).trim();
  const normalizedUsername = String(username).trim().toLowerCase();

  try {
    const accessible = await getAccessibleUserOrNull(req, userId);
    if (!accessible) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    const existingUsername = await User.unscoped().findOne({
      where: { username: normalizedUsername, id: { [Op.ne]: userId } },
    });
    if (existingUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await User.unscoped().findOne({
      where: { email: trimmedEmail, id: { [Op.ne]: userId } },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const user = await User.unscoped().findByPk(userId);
    user.fName = trimmedFName;
    user.lName = trimmedLName;
    user.email = trimmedEmail;
    user.username = normalizedUsername;
    if (nextPassword) {
      user.password = await bcrypt.hash(nextPassword, SALT_ROUNDS);
    }

    await user.save();

    const safeUser = await User.findByPk(userId);
    return res.status(200).send(profilePayload(safeUser));
  } catch (err) {
    logger.error(`update user failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update profile." });
  }
};

export default exports;
