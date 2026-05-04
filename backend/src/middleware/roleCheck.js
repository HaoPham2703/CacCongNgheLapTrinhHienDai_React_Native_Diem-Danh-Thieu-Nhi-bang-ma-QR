const createHttpError = require("../utils/httpError");

function requireRole(...allowedRoles) {
  return function roleCheck(request, _response, next) {
    if (!request.authUser) {
      next(createHttpError(401, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(request.authUser.role)) {
      next(createHttpError(403, "You do not have permission to access this resource"));
      return;
    }

    next();
  };
}

module.exports = requireRole;
