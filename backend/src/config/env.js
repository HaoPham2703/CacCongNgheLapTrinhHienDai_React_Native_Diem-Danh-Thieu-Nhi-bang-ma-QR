const dotenv = require("dotenv");

let loaded = false;

function loadEnv() {
  if (!loaded) {
    dotenv.config();
    loaded = true;
  }
}

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

module.exports = {
  loadEnv,
  getRequiredEnv,
};
