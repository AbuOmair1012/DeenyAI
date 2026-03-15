import dotenv from "dotenv";
import path from "path";
// Try both cwd and parent dir (npm workspace runs from server/)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
}
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import chatRoutes from "./routes/chat";
import adminRoutes from "./routes/admin";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", name: "DeenyAI API" });
});

app.listen(PORT, () => {
  console.log(`DeenyAI server running on port ${PORT}`);
});

export default app;
