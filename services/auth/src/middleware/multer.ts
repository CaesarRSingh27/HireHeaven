import express from "express";
import multer from "multer";

const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new Error("Only PDF, PNG, JPEG or WEBP files are allowed"));
  },
}).single("file");

const uploadFile: express.RequestHandler = (req, res, next) => {
  upload(req, res, (error: unknown) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "The upload must be 25 MB or smaller.",
      });
    }

    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Only PDF, PNG, JPEG or WEBP files are allowed.",
    });
  });
};

export default uploadFile;
