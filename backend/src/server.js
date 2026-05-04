const app = require("./app");
const { loadEnv, getRequiredEnv } = require("./config/env");
const connectDatabase = require("./config/database");

loadEnv();

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await connectDatabase(getRequiredEnv("MONGODB_URI"));

    app.listen(PORT, () => {
      console.log(`ClassPulse backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
