import {
  getCurrentDayStrikes,
  getFutureStrikes,
} from "@/controllers/strike.controller";
import { Router } from "express";

const router = Router();

router.get("/", getCurrentDayStrikes);
router.get("/future", getFutureStrikes);

export default router;
