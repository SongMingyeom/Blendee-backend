import express from "express";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

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
router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  res.json({
    message: "Authenticated!",
    userId: req.user?.id,
  });
});

export default router;
