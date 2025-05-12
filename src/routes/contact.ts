import { Router, Request, Response } from "express";
import { sentContactEmail } from "../controllers/contact";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  await sentContactEmail(req, res);
});

export default router;
