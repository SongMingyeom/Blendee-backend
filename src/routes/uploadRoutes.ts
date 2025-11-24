import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../config/s3";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET!,
    // acl: "public-read",
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
router.post("/image", authMiddleware, upload.single("image"), (req: any, res) => {
  res.json({
    message: "Image uploaded successfully",
    imageUrl: req.file.location,
  });
});

export default router;