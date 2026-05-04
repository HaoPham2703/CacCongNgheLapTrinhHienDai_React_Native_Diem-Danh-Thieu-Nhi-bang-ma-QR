const mongoose = require("mongoose");

async function connectDatabase(connectionString) {
  mongoose.set("strictQuery", true);

  await mongoose.connect(connectionString);
}

module.exports = connectDatabase;
