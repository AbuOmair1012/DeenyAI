import { Hono } from "hono";
import { cors } from "hono/cors";
import { initDb } from "./db";
import authRoutes from "./routes/auth.hono";
import chatRoutes from "./routes/chat.hono";
import adminRoutes from "./routes/admin.hono";

type Bindings = {
  HYPERDRIVE: Hyperdrive;
  DEEPSEEK_API_KEY: string;
  JWT_SECRET: string;
  TAVILY_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

// Inject Hyperdrive + secrets into process.env before any route runs
app.use("*", async (c, next) => {
  initDb(c.env.HYPERDRIVE.connectionString);
  process.env.DEEPSEEK_API_KEY = c.env.DEEPSEEK_API_KEY;
  process.env.JWT_SECRET = c.env.JWT_SECRET;
  process.env.TAVILY_API_KEY = c.env.TAVILY_API_KEY;
  await next();
});

app.route("/api/auth", authRoutes);
app.route("/api/chat", chatRoutes);
app.route("/api/admin", adminRoutes);
app.get("/api/health", (c) => c.json({ status: "ok", name: "DeenyAI API" }));

export default app;
