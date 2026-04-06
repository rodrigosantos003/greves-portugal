import { getStrikes } from "@/controllers/strike.controller";
import { Router } from "express";

const router = Router();

router.get("/", getStrikes);

export default router;
