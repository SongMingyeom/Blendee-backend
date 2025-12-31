import express from "express";
import { authenticateToken } from "../middleware/authMiddleware"; // 수정!

const router = express.Router();

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get my profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User info returned
 */
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    message: "Authenticated!",
    userId: req.user?.id,
  });
});

export default router;