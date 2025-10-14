import express from "express";
import Chat from "../models/Chat.js";

const router = express.Router();

// Create or get existing chat between two users
router.post("/", async (req, res) => {
  try {
    const { currentUserId, receiverId } = req.body;

    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, receiverId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [currentUserId, receiverId],
      });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: "Failed to create/get chat", error });
  }
});

export default router;
