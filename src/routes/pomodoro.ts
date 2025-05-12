import { Router } from "express";
import {
  saveFocusSession,
  getFocusSessions,
  getFocusSessionStats,
} from "../controllers/pomodoro";

const router = Router();

router.post("/sessions", async (req, res) => {
  await saveFocusSession(req, res);
});

router.get("/sessions", async (req, res) => {
  await getFocusSessions(req, res);
});

router.get("/stats", async (req, res) => {
  await getFocusSessionStats(req, res);
});

export default router;
