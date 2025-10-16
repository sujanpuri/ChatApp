import Chat from "../models/Chat.js";
import { randomBytes } from "crypto";

// Create a new group chat
export const createChat = async (req, res) => {
  try {
    const { name, createdBy, members } = req.body;

    if (!name || !createdBy || !members?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const chatId = "G-" + randomBytes(4).toString("hex");

    const newChat = await Chat.create({
      chatId,
      name,
      createdBy,
      members,
    });

    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all chats where user is a member
export const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await Chat.find({ members: userId }).sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new members to existing chat
export const addMembers = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { members } = req.body;

    const chat = await Chat.findOne({ chatId });

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.members.push(...members);
    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
