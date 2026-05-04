function getHealth(_request, response) {
  response.status(200).json({
    status: "ok",
    service: "classpulse-attendance-backend",
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getHealth,
};
