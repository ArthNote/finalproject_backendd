import express, { Request, Response } from "express";
import {
  getUserProgress,
  getGoals,
  updateGoalProgress,
  updateStreak,
  getRewards,
  unlockReward,
  generateGoals,
  getUnlockedRewards,
} from "../controllers/goals";

const router = express.Router();

router.get("/progress", async (req: Request, res: Response) => {
  await getUserProgress(req, res);
});

router.get("/goals", async (req: Request, res: Response) => {
  await getGoals(req, res);
});

router.patch(
  "/goals/:id/progress",
  async (
    req: Request<{ id: string }, {}, { progress: number }>,
    res: Response
  ) => {
    await updateGoalProgress(req, res);
  }
);

router.post("/streak", async (req: Request, res: Response) => {
  await updateStreak(req, res);
});

router.get("/rewards", async (req: Request, res: Response) => {
  await getRewards(req, res);
});

router.get("/rewards/unlocked", async (req: Request, res: Response) => {
  await getUnlockedRewards(req, res);
});

router.post(
  "/rewards/:id/unlock",
  async (req: Request<{ id: string }>, res: Response) => {
    await unlockReward(req, res);
  }
);

router.post("/generate", async (req: Request, res: Response) => {
  await generateGoals(req, res);
});

export default router;
