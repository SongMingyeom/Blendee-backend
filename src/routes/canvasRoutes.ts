// src/routes/canvasRoutes.ts
import express from "express";
import * as canvasController from "../controllers/canvasController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/canvas/create:
 *   post:
 *     tags:
 *       - Canvas
 *     summary: Create a new canvas
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blockCount:
 *                 type: integer
 *                 default: 16
 *                 description: Number of blocks in the canvas (default 16)
 *     responses:
 *       201:
 *         description: Canvas created successfully
 *       401:
 *         description: Unauthorized
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
 *               - blockColor
 *             properties:
 *               roomCode:
 *                 type: string
 *                 description: 6-character room code
 *                 example: ABC123
 *               blockColor:
 *                 type: string
 *                 description: Hex color code for user's blocks
 *                 example: "#FF6B6B"
 *     responses:
 *       200:
 *         description: Joined canvas successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/join", authenticateToken, canvasController.joinCanvas);

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
 *         description: Canvases retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/my", authenticateToken, canvasController.getMyCanvases);

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
 *         description: Canvas ID
 *     responses:
 *       200:
 *         description: Canvas retrieved successfully
 *       404:
 *         description: Canvas not found
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
 *         description: Canvas ID
 *     responses:
 *       200:
 *         description: Canvas completed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.patch("/:id/complete", authenticateToken, canvasController.completeCanvas);

export default router;