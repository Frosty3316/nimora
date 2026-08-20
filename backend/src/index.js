import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.set("trust proxy", 1);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (origin.endsWith(".netlify.app")) return true;
  const extra = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return extra.includes(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "nimora-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/dashboard", dashboardRouter);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Nimora API running on http://localhost:${port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the other process and try again.`);
  } else {
    console.error("Failed to start API:", err.message);
  }
  process.exit(1);
});
