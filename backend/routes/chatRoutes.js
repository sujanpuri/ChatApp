import express from "express";
import { createChat, getUserChats, addMembers } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", createChat);
router.get("/:userId", getUserChats);
router.put("/:chatId/add-members", addMembers);

export default router;
