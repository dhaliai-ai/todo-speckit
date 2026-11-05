import db from "../models/index.js";
import logger from "../config/logger.js";

const Session = db.session;
const User = db.user;

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
