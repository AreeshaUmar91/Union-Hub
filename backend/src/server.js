import "dotenv/config";
import cors from "cors";
import express from "express";
import { createDb } from "./db.js";
import { createAuthRouter } from "./routes/auth.js";
import { createDirectorUsersRouter } from "./routes/directorUsers.js";
import { createContentRouter } from "./routes/content.js";
import { startScheduler } from "./services/scheduler.js";

const port = Number(process.env.PORT || 4000);
const jwtSecret =
  process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-jwt-secret");
if (!jwtSecret) throw new Error("JWT_SECRET is required");

const db = createDb({ dbPath: process.env.DB_PATH });

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", createAuthRouter({ db, jwtSecret }));
app.use("/api/director/users", createDirectorUsersRouter({ db, jwtSecret }));
app.use("/api/content", createContentRouter({ db, jwtSecret }));

// Connect to DB before listening
db.connect()
  .then(() => {
    startScheduler(db);
    app.listen(port, () => {
      process.stdout.write(`Backend listening on http://localhost:${port}\n`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
  });
