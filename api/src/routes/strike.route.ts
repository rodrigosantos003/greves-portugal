import {
  getCurrentDayStrikes,
  getFutureStrikes,
} from "@/controllers/strike.controller";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";

const strikesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.get("/", strikesLimiter, getCurrentDayStrikes);
router.get("/future", strikesLimiter, getFutureStrikes);

export default router;
