const jwt = require("jsonwebtoken");
const Example = require("../models/example");
const log = require("../utils/logger");
async function auth(req, res, next) {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const example = await Example.findOne({
      _id: decodedToken._id,
      "tokens.token": token,
    }).exec();
    if (!example) {
      throw new Error("Invalid token");
    }
    req.token = token;
    req.example = example;
    next();
  } catch (err) {
    res.status(401).send({ error: "Please authenticate" });
  }
}

module.exports = auth;
