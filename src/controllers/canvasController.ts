// src/controllers/canvasController.ts
import { Request, Response } from "express";
import * as canvasService from "../services/canvasService";

// Canvas 생성
export const createCanvas = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { blockCount } = req.body;

    const canvas = await canvasService.createCanvas(
      userId,
      blockCount || 16
    );

    return res.status(201).json({
      message: "Canvas created successfully",
      data: canvas,
    });
  } catch (error: any) {
    console.error("Create canvas error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Canvas 참여
export const joinCanvas = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { roomCode, blockColor } = req.body;

    if (!roomCode || !blockColor) {
      return res.status(400).json({
        message: "Room code and block color are required",
      });
    }

    const result = await canvasService.joinCanvas(userId, roomCode, blockColor);

    return res.status(200).json({
      message: "Joined canvas successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Join canvas error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// Canvas 상세 조회
export const getCanvas = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const canvasId = parseInt(req.params.id);

    if (isNaN(canvasId)) {
      return res.status(400).json({ message: "Invalid canvas ID" });
    }

    const canvas = await canvasService.getCanvasById(canvasId, userId);

    return res.status(200).json({
      message: "Canvas retrieved successfully",
      data: canvas,
    });
  } catch (error: any) {
    console.error("Get canvas error:", error);
    return res.status(404).json({ message: error.message });
  }
};

// 내 Canvas 목록 조회
export const getMyCanvases = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const canvases = await canvasService.getMyCanvases(userId);

    return res.status(200).json({
      message: "Canvases retrieved successfully",
      data: canvases,
    });
  } catch (error: any) {
    console.error("Get my canvases error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Canvas 완료
export const completeCanvas = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const canvasId = parseInt(req.params.id);
    if (isNaN(canvasId)) {
      return res.status(400).json({ message: "Invalid canvas ID" });
    }

    const canvas = await canvasService.completeCanvas(canvasId, userId);

    return res.status(200).json({
      message: "Canvas completed successfully",
      data: canvas,
    });
  } catch (error: any) {
    console.error("Complete canvas error:", error);
    return res.status(400).json({ message: error.message });
  }
};