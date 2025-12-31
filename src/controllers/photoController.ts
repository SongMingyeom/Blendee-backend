// src/controllers/photoController.ts
import { Request, Response } from "express";
import * as photoService from "../services/photoService";

// 사진 제출
export const submitPhoto = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { canvasId, blockId, photoUrl } = req.body;

    if (!canvasId || !blockId || !photoUrl) {
      return res.status(400).json({
        message: "Canvas ID, block ID, and photo URL are required",
      });
    }

    const photo = await photoService.submitPhoto(
      userId,
      parseInt(canvasId),
      parseInt(blockId),
      photoUrl
    );

    return res.status(201).json({
      message: "Photo submitted successfully",
      data: photo,
    });
  } catch (error: any) {
    console.error("Submit photo error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// 사진 승인
export const acceptPhoto = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const photoId = parseInt(req.params.id);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: "Invalid photo ID" });
    }

    const photo = await photoService.acceptPhoto(photoId, userId);

    return res.status(200).json({
      message: "Photo accepted successfully",
      data: photo,
    });
  } catch (error: any) {
    console.error("Accept photo error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// 사진 거부
export const rejectPhoto = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const photoId = parseInt(req.params.id);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: "Invalid photo ID" });
    }

    const result = await photoService.rejectPhoto(photoId, userId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Reject photo error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// Canvas의 대기 중인 사진 목록
export const getPendingPhotos = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const canvasId = parseInt(req.params.canvasId);
    if (isNaN(canvasId)) {
      return res.status(400).json({ message: "Invalid canvas ID" });
    }

    const photos = await photoService.getPendingPhotos(canvasId, userId);

    return res.status(200).json({
      message: "Pending photos retrieved successfully",
      data: photos,
    });
  } catch (error: any) {
    console.error("Get pending photos error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// 내가 제출한 사진 목록
export const getMyPhotos = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const photos = await photoService.getMyPhotos(userId);

    return res.status(200).json({
      message: "Photos retrieved successfully",
      data: photos,
    });
  } catch (error: any) {
    console.error("Get my photos error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// 내 갤러리
export const getMyGallery = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const gallery = await photoService.getMyGallery(userId);

    return res.status(200).json({
      message: "Gallery retrieved successfully",
      data: gallery,
    });
  } catch (error: any) {
    console.error("Get gallery error:", error);
    return res.status(500).json({ message: error.message });
  }
};