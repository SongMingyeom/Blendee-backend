import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import canvasRoutes from "./routes/canvasRoutes";  // 추가!
import photoRoutes from "./routes/photoRoutes";    // 추가!
import feedRoutes from "./routes/feedRoutes";      // 추가!
import { swaggerSpec, swaggerUiMiddleware } from "./config/swagger";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger UI
app.use("/api-docs", swaggerUiMiddleware.serve, swaggerUiMiddleware.setup(swaggerSpec));
console.log("📘 Swagger UI loaded");

// Default Route
app.get("/", (req, res) => {
  res.send("🍡 Blendee Backend is running!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/canvas", canvasRoutes);  // 추가!
app.use("/api/photo", photoRoutes);    // 추가!
app.use("/api/feed", feedRoutes);      // 추가!

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});