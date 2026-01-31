// ================================
// Load & validate environment vars
// ================================
import "./config/env.js";

import http from "http";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

/* ================================
   Create HTTP server
================================ */
const server = http.createServer(app);

/* ================================
   Start listening
================================ */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* ================================
   Graceful shutdown (PRODUCTION)
================================ */
const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force exit if hanging connections
  setTimeout(() => {
    console.error("Force shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

/* ================================
   Handle unexpected crashes
================================ */
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  shutdown("unhandledRejection");
});
