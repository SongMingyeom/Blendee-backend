// src/routes/userRoutes.ts
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import * as userController from "../controllers/userController";

const router = express.Router();

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     tags:
 *       - User
 *     summary: Get my profile with stats
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     profileImageUrl:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     stats:
 *                       type: object
 *                       properties:
 *                         connectedColors:
 *                           type: integer
 *                         completedPhotos:
 *                           type: integer
 *                         uploadedPosts:
 *                           type: integer
 */
router.get("/me", authenticateToken, userController.getUserProfile);

/**
 * @swagger
 * /api/user/stats:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user statistics only
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     connectedColors:
 *                       type: integer
 *                       description: 참여한 Canvas 수
 *                     completedPhotos:
 *                       type: integer
 *                       description: 승인된 사진 수
 *                     uploadedPosts:
 *                       type: integer
 *                       description: 피드에 올린 게시물 수
 */
router.get("/stats", authenticateToken, userController.getUserStats);

export default router;