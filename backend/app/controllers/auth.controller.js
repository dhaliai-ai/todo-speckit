import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import logger from "../config/logger.js";
import authConfig from "../config/auth.config.js";

const User = db.user;
const Session = db.session;
const { Op } = db.Sequelize;

const SALT_ROUNDS = 10;
const SESSION_TTL_SECONDS = 86400;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isBlank = (value) => value == null || String(value).trim() === "";

const authPayload = (user, token) => ({
  userId: user.id,
  username: user.username,
  email: user.email,
  fName: user.fName,
  lName: user.lName,
  role: user.role,
  token,
});

const getOrCreateSession = async (user) => {
  const existing = await Session.findOne({
    where: {
      userId: user.id,
      expirationDate: { [Op.gte]: new Date() },
      token: { [Op.and]: [{ [Op.ne]: "" }, { [Op.ne]: null }] },
    },
  });

  if (existing?.token) {
    return existing.token;
  }

  const token = jwt.sign({ id: user.id }, authConfig.secret, {
    expiresIn: SESSION_TTL_SECONDS,
  });

  await Session.create({
    token,
    email: user.email,
    expirationDate: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    userId: user.id,
  });

  return token;
};

const exports = {};

exports.register = async (req, res) => {
  const { fName, lName, email, username, password } = req.body ?? {};

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
  if (isBlank(password)) {
    return res.status(400).send({ message: "Password is required." });
  }
  if (String(password).length < 8) {
    return res.status(400).send({ message: "Password must be at least 8 characters." });
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  const trimmedEmail = String(email).trim();

  try {
    const existingUsername = await User.unscoped().findOne({
      where: { username: normalizedUsername },
    });
    if (existingUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await User.unscoped().findOne({
      where: { email: trimmedEmail },
    });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      fName: String(fName).trim(),
      lName: String(lName).trim(),
      email: trimmedEmail,
      username: normalizedUsername,
      password: hashedPassword,
      role: "worker",
    });

    const token = await getOrCreateSession(user);
    return res.status(201).send(authPayload(user, token));
  } catch (err) {
    logger.error(`Register failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to register." });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body ?? {};

  if (isBlank(username)) {
    return res.status(400).send({ message: "Username is required." });
  }
  if (isBlank(password)) {
    return res.status(400).send({ message: "Password is required." });
  }

  const normalizedUsername = String(username).trim().toLowerCase();

  try {
    const user = await User.unscoped().findOne({
      where: { username: normalizedUsername },
    });

    if (!user) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const token = await getOrCreateSession(user);
    return res.status(200).send(authPayload(user, token));
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to login." });
  }
};

exports.logout = async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = String(header).split(" ")[1];
    const session = await Session.findOne({ where: { token } });

    if (session) {
      session.token = "";
      await session.save();
    }

    return res.status(200).send({ message: "Logged out." });
  } catch (err) {
    logger.error(`Logout failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to logout." });
  }
};

export default exports;
