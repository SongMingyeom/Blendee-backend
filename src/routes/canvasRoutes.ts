// src/routes/canvasRoutes.ts
import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import * as canvasController from "../controllers/canvasController";

const router = express.Router();

/**
 * @swagger
 * /api/canvas/create:
 *   post:
 *     tags:
 *       - Canvas
 *     summary: Create a new canvas with auto pixelization
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceImageUrl
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               hashtags:
 *                 type: array
 *                 items:
 *                   type: string
 *               sourceImageUrl:
 *                 type: string
 *               blockCount:
 *                 type: integer
 *                 enum: [16, 64, 128]
 *               isPublic:
 *                 type: boolean
 *               password:
 *                 type: string
 *               timeLimit:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Canvas created successfully
 */
router.post("/create", authenticateToken, canvasController.createCanvas);

/**
 * @swagger
 * /api/canvas/join:
 *   post:
 *     tags:
 *       - Canvas
 *     summary: Join a canvas with room code
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomCode
 *               - assignmentType
 *             properties:
 *               roomCode:
 *                 type: string
 *               assignmentType:
 *                 type: string
 *                 enum: [random, select, recommend]
 *               selectedColor:
 *                 type: string
 *                 description: Required for 'select' mode
 *               password:
 *                 type: string
 *                 description: Required for private canvas
 *     responses:
 *       200:
 *         description: Joined successfully
 */
router.post("/join", authenticateToken, canvasController.joinCanvas);

/**
 * @swagger
 * /api/canvas/{id}/available-colors:
 *   get:
 *     tags:
 *       - Canvas
 *     summary: Get available colors for selection
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Available colors list
 */
router.get(
  "/:id/available-colors",
  canvasController.getAvailableColors
);



/**
 * @swagger
 * /api/canvas/my:
 *   get:
 *     tags:
 *       - Canvas
 *     summary: Get my canvases
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Canvas list
 */
router.get("/my", authenticateToken, canvasController.getMyCanvases);

router.get(
  "/:id/my-blocks",
  authenticateToken,
  canvasController.getMyAssignedBlocks
);

/**
 * @swagger
 * /api/canvas/{id}:
 *   get:
 *     tags:
 *       - Canvas
 *     summary: Get canvas by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Canvas details
 */
router.get("/:id", authenticateToken, canvasController.getCanvas);

/**
 * @swagger
 * /api/canvas/{id}/complete:
 *   patch:
 *     tags:
 *       - Canvas
 *     summary: Complete a canvas
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Canvas completed
 */
router.patch(
  "/:id/complete",
  authenticateToken,
  canvasController.completeCanvas
);

export default router;