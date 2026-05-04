const jwt = require("jsonwebtoken");

const { getRequiredEnv } = require("../config/env");

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    getRequiredEnv("JWT_SECRET"),
    {
      expiresIn: process.env.JWT_EXPIRY || "7d",
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, getRequiredEnv("JWT_SECRET"));
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
