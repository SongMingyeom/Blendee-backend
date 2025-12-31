// src/controllers/feedController.ts
import { Request, Response } from "express";
import * as feedService from "../services/feedService";

// Canvas를 피드에 등록
export const createFeedPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { canvasId } = req.body;

    if (!canvasId) {
      return res.status(400).json({ message: "Canvas ID is required" });
    }

    const feedPost = await feedService.createFeedPost(
      parseInt(canvasId),
      userId
    );

    return res.status(201).json({
      message: "Feed post created successfully",
      data: feedPost,
    });
  } catch (error: any) {
    console.error("Create feed post error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// 피드 목록 조회
export const getFeedPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await feedService.getFeedPosts(page, limit);

    return res.status(200).json({
      message: "Feed posts retrieved successfully",
      data: result.posts,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("Get feed posts error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// 피드 상세 조회
export const getFeedPostById = async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const post = await feedService.getFeedPostById(postId);

    return res.status(200).json({
      message: "Feed post retrieved successfully",
      data: post,
    });
  } catch (error: any) {
    console.error("Get feed post error:", error);
    return res.status(404).json({ message: error.message });
  }
};

// 내 피드 포스트 목록
export const getMyFeedPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const posts = await feedService.getMyFeedPosts(userId);

    return res.status(200).json({
      message: "My feed posts retrieved successfully",
      data: posts,
    });
  } catch (error: any) {
    console.error("Get my feed posts error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// 피드 포스트 삭제
export const deleteFeedPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const result = await feedService.deleteFeedPost(postId, userId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Delete feed post error:", error);
    return res.status(400).json({ message: error.message });
  }
};