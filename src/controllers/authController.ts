// src/controllers/authController.ts
import { Request, Response } from "express";
import * as authService from "../services/authService";

// 회원가입
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const result = await authService.register(username, email, password);

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("Register error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 로그인
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await authService.login(email, password);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// 비밀번호 재설정 요청
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await authService.requestPasswordReset(email);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Request password reset error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
    });
  }
};

// 비밀번호 재설정
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const result = await authService.resetPassword(token, newPassword);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};