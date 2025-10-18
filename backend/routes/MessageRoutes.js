import express from "express";
import { sendMessage, getMessages, markMessagesSeen } from "../controllers/messageController.js";

const router = express.Router();

router.post("/", sendMessage);
router.get("/:chatId", getMessages);
// Mark messages as seen
router.post("/seen", markMessagesSeen);

export default router;
