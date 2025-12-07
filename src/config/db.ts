import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const connectDB = async () => {
  try {
    await pool.connect();
    console.log("🚀 Connected to PostgreSQL RDS");
  } catch (err) {
    console.error("❌ PostgreSQL Connection Error", err);
    process.exit(1);
  }
};