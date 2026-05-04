const express = require("express");
const cors = require("cors");

const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use((request, response, next) => {
  const startedAt = Date.now();

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${request.originalUrl} ${response.statusCode} ${durationMs}ms`
    );
  });

  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
  })
);
app.use(express.json());

app.use("/api/v1", routes);

app.use(errorHandler);

module.exports = app;
