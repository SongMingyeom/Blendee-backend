// src/routes/photoRoutes.ts
import express from "express";
import * as photoController from "../controllers/photoController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /api/photo/submit:
 *   post:
 *     tags:
 *       - Photo
 *     summary: Submit a photo to a canvas block
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
 *               - blockId
 *               - photoUrl
 *             properties:
 *               canvasId:
 *                 type: integer
 *               blockId:
 *                 type: integer
 *               photoUrl:
 *                 type: string
 *                 description: S3 URL from /api/upload/image
 *     responses:
 *       201:
 *         description: Photo submitted successfully
 *       400:
 *         description: Bad request
 */
router.post("/submit", authenticateToken, photoController.submitPhoto);

/**
 * @swagger
 * /api/photo/{id}/accept:
 *   patch:
 *     tags:
 *       - Photo
 *     summary: Accept a submitted photo (Canvas creator only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Photo ID
 *     responses:
 *       200:
 *         description: Photo accepted successfully
 *       400:
 *         description: Bad request
 */
router.patch("/:id/accept", authenticateToken, photoController.acceptPhoto);

/**
 * @swagger
 * /api/photo/{id}/reject:
 *   delete:
 *     tags:
 *       - Photo
 *     summary: Reject a submitted photo (Canvas creator only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Photo ID
 *     responses:
 *       200:
 *         description: Photo rejected successfully
 *       400:
 *         description: Bad request
 */
router.delete("/:id/reject", authenticateToken, photoController.rejectPhoto);

/**
 * @swagger
 * /api/photo/pending/{canvasId}:
 *   get:
 *     tags:
 *       - Photo
 *     summary: Get pending photos for a canvas (Canvas creator only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: canvasId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Canvas ID
 *     responses:
 *       200:
 *         description: Pending photos retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get("/pending/:canvasId", authenticateToken, photoController.getPendingPhotos);

/**
 * @swagger
 * /api/photo/my:
 *   get:
 *     tags:
 *       - Photo
 *     summary: Get my submitted photos
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Photos retrieved successfully
 */
router.get("/my", authenticateToken, photoController.getMyPhotos);

/**
 * @swagger
 * /api/photo/gallery:
 *   get:
 *     tags:
 *       - Photo
 *     summary: Get my gallery (accepted photos)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Gallery retrieved successfully
 */
router.get("/gallery", authenticateToken, photoController.getMyGallery);

export default router;