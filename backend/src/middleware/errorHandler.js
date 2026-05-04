function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode >= 500 ? "Internal server error" : error.message;

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json({
    message,
  });
}

module.exports = errorHandler;
