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
app.get("/", (req, res) => {
  res.send("🍡 Blendee Backend is running!");
});

// Auth 라우트 등록
app.use("/api/auth", authRoutes);

// 서버 시작
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));
