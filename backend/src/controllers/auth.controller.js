const { User } = require("../models/User");
const createHttpError = require("../utils/httpError");
const { signAccessToken } = require("../utils/jwt");

async function login(request, response, next) {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      throw createHttpError(400, "Email and password are required");
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    }).select("+passwordHash");

    if (!user) {
      throw createHttpError(401, "Invalid email or password");
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw createHttpError(401, "Invalid email or password");
    }

    const accessToken = signAccessToken(user);

    response.status(200).json({
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

function logout(_request, response) {
  response.status(200).json({
    message: "Logged out successfully",
  });
}

module.exports = {
  login,
  logout,
};
