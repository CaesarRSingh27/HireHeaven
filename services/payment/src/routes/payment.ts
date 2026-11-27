import express from "express";
import rateLimit from "express-rate-limit";
import { isAuth } from "../middlewares/auth.js";
import { checkOut, paymentVerification, getPlans } from "../controllers/payment.js";

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down" },
});

router.get("/plans", getPlans);
router.post("/checkout", limiter, isAuth, checkOut);
router.post("/verify", limiter, isAuth, paymentVerification);

export default router;
