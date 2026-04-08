import { getCurrentDayStrikes } from "@/controllers/strike.controller";
import { Router } from "express";

const router = Router();

router.get("/", getCurrentDayStrikes);

export default router;
