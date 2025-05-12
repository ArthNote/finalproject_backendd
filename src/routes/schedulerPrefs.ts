import { Router, Request, Response } from "express";
import {
  getSchedulerModes,
  createSchedulerMode,
  updateSchedulerMode,
  deleteSchedulerMode,
  setPreferredMode,
  getPreferredMode,
  SchedulerModeType,
} from "../controllers/schedulerPrefs";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  await getSchedulerModes(req, res);
});

router.post("/", async (req: Request, res: Response) => {
  await createSchedulerMode(req, res);
});

router.put(
  "/preferred/:id",
  async (
    req: Request<{ id: string }, {}, { isBuiltIn: boolean }>,
    res: Response
  ) => {
    await setPreferredMode(req, res);
  }
);

router.put(
  "/:id",
  async (
    req: Request<{ id: string }, {}, Partial<SchedulerModeType>>,
    res: Response
  ) => {
    await updateSchedulerMode(req, res);
  }
);

router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
  await deleteSchedulerMode(req, res);
});

router.get("/preferred", async (req: Request, res: Response) => {
  await getPreferredMode(req, res);
});

export default router;
