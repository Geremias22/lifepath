const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");
const registerRoomSocket = require("./sockets/roomSocket");

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 3000;
const HOST = !process.env.HOST || process.env.HOST === "HOST" ? "0.0.0.0" : process.env.HOST;
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin || allowedOrigins.length === 0) return true;
  return allowedOrigins.includes(origin);
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origen no permitido por CORS."));
  },
  methods: ["GET", "POST"],
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "LifePath",
    realtime: "socket.io",
    provider: process.env.LLM_PROVIDER || "local",
  });
});

registerRoomSocket(io);

httpServer.listen(PORT, HOST, () => {
  console.log(`LifePath listo en http://${HOST}:${PORT}`);
});
