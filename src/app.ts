<<<<<<< HEAD
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import { swaggerSpec, swaggerUiMiddleware } from "./config/swagger";
import userRoutes from "./routes/userRoutes";
import uploadRoutes from "./routes/uploadRoutes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use("/api-docs", swaggerUiMiddleware.serve, swaggerUiMiddleware.setup(swaggerSpec));
console.log("📘 Swagger UI loaded");

// Connect DB
connectDB();

// Default Route
=======
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB 연결
connectDB();

// 기본 라우트
>>>>>>> da5501685f29f7be7618f6eeebc647d873a38f82
app.get("/", (req, res) => {
  res.send("🍡 Blendee Backend is running!");
});

<<<<<<< HEAD
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/upload", uploadRoutes);

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
=======
// Auth 라우트 등록
app.use("/api/auth", authRoutes);

// 서버 시작
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));
>>>>>>> da5501685f29f7be7618f6eeebc647d873a38f82
