function getCurrentUser(request, response) {
  response.status(200).json({
    user: request.authUser,
  });
}

module.exports = {
  getCurrentUser,
};
