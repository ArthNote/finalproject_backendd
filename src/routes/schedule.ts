import { Router, Request, Response } from "express";
import { schedule } from "../controllers/schedule";
const router = Router();

router.post(
  "/",
  async (
    req: Request<
      {},
      {},
      {},
      {
        taskSelectionMode: "unscheduled" | "reschedule" | "full";
        timePeriodType: "today" | "tomorrow" | "this_week" | "custom";
        customRangeStart: Date;
        customRangeEnd: Date;
        respectFixedAppointments: boolean;
        addBreaksEnabled: boolean;
        optimizeFocusTimeEnabled: boolean;
        includePastTasks: boolean;
        schedulerModeId: string;
        isBuiltIn: boolean;
      }
    >,
    res: Response
  ) => {
    await schedule(req, res);
  }
);

export default router;
