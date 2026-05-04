const { User } = require("../models/User");
const createHttpError = require("../utils/httpError");
const { verifyAccessToken } = require("../utils/jwt");

async function authenticate(request, _response, next) {
  try {
    const authorizationHeader = request.headers.authorization || "";
    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw createHttpError(401, "Authentication required");
    }

    const payload = verifyAccessToken(token);
    const user = await User.findOne({
      _id: payload.sub,
      isActive: true,
    }).select("_id fullName email role isActive");

    if (!user) {
      throw createHttpError(401, "Authentication required");
    }

    request.authUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      next(createHttpError(401, "Invalid or expired token"));
      return;
    }

    next(error);
  }
}

module.exports = authenticate;
