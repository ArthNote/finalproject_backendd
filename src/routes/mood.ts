import { Router } from "express";
import {
  getTodaysMood,
  getMoodHistory,
  saveMoodEntry,
  getMoodByDate,
  deleteMoodEntry,
} from "../controllers/mood";

const router = Router();

router.get("/today", async (req, res) => {
  await getTodaysMood(req, res);
});

router.get("/history", async (req, res) => {
  await getMoodHistory(req, res);
});

router.post("/", async (req, res) => {
  await saveMoodEntry(req, res);
});

router.get("/date/:date", async (req, res) => {
  await getMoodByDate(req, res);
});

router.delete("/:id", async (req, res) => {
  await deleteMoodEntry(req, res);
});

export default router;
