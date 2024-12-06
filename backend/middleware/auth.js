import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) {
      return res.status(400).send({ error: "Token is missing from request" });
    }
    const cleanToken = token.replace("Bearer ", "");

    const decoded = jwt.verify(
      cleanToken,
      process.env.JWT_SECRET || "RANDOM-TOKEN"
    );

    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": cleanToken,
    });

    if (!user) {
      return res.status(401).send({ error: "Invalid token, user not found" });
    }
    const { password, ...userWithoutPassword } = user;

    req.token = cleanToken;
    req.rawToken = token;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    return res.status(401).send({ error: "Authentication required" });
  }
};

export default auth;
