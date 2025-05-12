import { Router } from "express";
import {
  sendMessage,
  getMessages,
  updateMessageStatus,
  searchMessages,
  deleteMessage,
} from "../controllers/messages";

const router = Router();

router.get("/:chatId", async (req, res) => {
  await getMessages(req, res);
});

router.post("/:chatId", async (req, res) => {
  await sendMessage(req, res);
});

router.patch("/:messageId/status", async (req, res) => {
  await updateMessageStatus(req, res);
});

router.get("/:chatId/search", async (req, res) => {
  await searchMessages(req, res);
});

router.delete("/:messageId", async (req, res) => {
  await deleteMessage(req, res);
});

export default router;
