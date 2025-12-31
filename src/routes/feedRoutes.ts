// src/routes/feedRoutes.ts
import express from "express";
import * as feedController from "../controllers/feedController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/feed/create:
 *   post:
 *     tags:
 *       - Feed
 *     summary: Create a feed post from completed canvas
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - canvasId
 *             properties:
 *               canvasId:
 *                 type: integer
 *                 description: ID of completed canvas
 *     responses:
 *       201:
 *         description: Feed post created successfully
 *       400:
 *         description: Bad request
 */
router.post("/create", authenticateToken, feedController.createFeedPost);

/**
 * @swagger
 * /api/feed:
 *   get:
 *     tags:
 *       - Feed
 *     summary: Get feed posts (public)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Feed posts retrieved successfully
 */
router.get("/", feedController.getFeedPosts);

/**
 * @swagger
 * /api/feed/my:
 *   get:
 *     tags:
 *       - Feed
 *     summary: Get my feed posts
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: My feed posts retrieved successfully
 */
router.get("/my", authenticateToken, feedController.getMyFeedPosts);

/**
 * @swagger
 * /api/feed/{id}:
 *   get:
 *     tags:
 *       - Feed
 *     summary: Get feed post by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feed post ID
 *     responses:
 *       200:
 *         description: Feed post retrieved successfully
 *       404:
 *         description: Feed post not found
 */
router.get("/:id", feedController.getFeedPostById);

/**
 * @swagger
 * /api/feed/{id}:
 *   delete:
 *     tags:
 *       - Feed
 *     summary: Delete feed post (Canvas creator only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feed post ID
 *     responses:
 *       200:
 *         description: Feed post deleted successfully
 *       400:
 *         description: Bad request
 */
router.delete("/:id", authenticateToken, feedController.deleteFeedPost);

export default router;