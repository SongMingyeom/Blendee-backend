// src/controllers/userController.ts
import { Request, Response } from "express";
import * as userService from "../services/userService";

// 사용자 통계 조회
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const stats = await userService.getUserStats(userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Get user stats error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// 사용자 프로필 조회 (통계 포함)
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = await userService.getUserProfile(userId);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error("Get user profile error:", error);
    return res.status(500).json({ message: error.message });
  }
};