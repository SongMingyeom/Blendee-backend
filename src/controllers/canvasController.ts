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

    const {
      title,
      description,
      hashtags,
      sourceImageUrl,
      blockCount,
      isPublic,
      password,
      timeLimit,
    } = req.body;

    if (!sourceImageUrl) {
      return res.status(400).json({
        success: false,
        message: "Source image URL is required",
      });
    }

    if (blockCount && ![16, 64, 128].includes(blockCount)) {
      return res.status(400).json({
        success: false,
        message: "Block count must be 16, 64, or 128",
      });
    }

    const canvas = await canvasService.createCanvas(userId, {
      title,
      description,
      hashtags,
      sourceImageUrl,
      blockCount: blockCount || 16,
      isPublic: isPublic !== false,
      password,
      timeLimit,
    });

    return res.status(201).json({
      success: true,
      message: "Canvas created successfully with pixelized colors",
      data: canvas,
    });
  } catch (error: any) {
    console.error("Create canvas error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Canvas 참여
export const joinCanvas = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { roomCode, assignmentType, selectedColor, password } = req.body;

    if (!roomCode || !assignmentType) {
      return res.status(400).json({
        message: "Room code and assignment type are required",
      });
    }

    if (!["random", "select", "recommend"].includes(assignmentType)) {
      return res.status(400).json({
        message: "Assignment type must be 'random', 'select', or 'recommend'",
      });
    }

    if (assignmentType === "select" && !selectedColor) {
      return res.status(400).json({
        message: "Selected color is required for 'select' mode",
      });
    }

    const result = await canvasService.joinCanvas(userId, roomCode, {
      password,
      assignmentType,
      selectedColor,
    });

    return res.status(200).json({
      success: true,
      message: "Joined canvas successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Join canvas error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 사용 가능한 색상 목록
export const getAvailableColors = async (req: Request, res: Response) => {
  try {
    const canvasId = parseInt(req.params.id);

    if (isNaN(canvasId)) {
      return res.status(400).json({ message: "Invalid canvas ID" });
    }

    const colors = await canvasService.getAvailableColors(canvasId);

    return res.status(200).json({
      success: true,
      data: colors,
    });
  } catch (error: any) {
    console.error("Get available colors error:", error);
    return res.status(500).json({ message: error.message });
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
      success: true,
      message: "Canvas retrieved successfully",
      data: canvas,
    });
  } catch (error: any) {
    console.error("Get canvas error:", error);
    return res.status(404).json({ message: error.message });
  }
};

// 내 Canvas 목록
export const getMyCanvases = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const canvases = await canvasService.getMyCanvases(userId);

    return res.status(200).json({
      success: true,
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
      success: true,
      message: "Canvas completed successfully",
      data: canvas,
    });
  } catch (error: any) {
    console.error("Complete canvas error:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const getMyAssignedBlocks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const canvasId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const blocks = await canvasService.getMyAssignedBlocks(userId, canvasId);

    return res.status(200).json({
      success: true,
      data: blocks,
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};