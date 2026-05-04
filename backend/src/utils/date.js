function formatDateOnly(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  return date.toISOString().slice(0, 10);
}

module.exports = {
  formatDateOnly,
};
