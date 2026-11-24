import express from "express";
import rateLimit from "express-rate-limit";
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
} from "../controllers/auth.js";
import uploadFile from "../middleware/multer.js";

const router = express.Router();

const limiter = (max: number, windowMs: number) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later" },
  });

const authLimiter = limiter(20, 15 * 60 * 1000); // 20 / 15 min / IP
const forgotLimiter = limiter(5, 60 * 60 * 1000); // 5 / hour / IP

router.post("/register", authLimiter, uploadFile, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/forgot", forgotLimiter, forgotPassword);
router.post("/reset/:token", authLimiter, resetPassword);

export default router;
