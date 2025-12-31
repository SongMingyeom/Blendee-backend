import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3";
import { authenticateToken } from "../middleware/authMiddleware"; // 수정!

const router = express.Router();

// src/routes/uploadRoutes.ts
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET!,
    acl: "public-read", // 👈 이 줄 주석 해제!
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const filename = `images/${Date.now()}-${file.originalname}`;
      cb(null, filename);
    },
  }),
});

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload image to S3
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post("/image", authenticateToken, upload.single("image"), (req, res) => {
  if (!req.file || !('location' in req.file)) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  
  res.json({
    message: "Image uploaded successfully",
    imageUrl: (req.file as any).location,
  });
});

export default router;