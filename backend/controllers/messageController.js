import Message from "../models/Message.js";

export const sendMessage = async (req, res) => {
  try {
    const { chatId, senderId, text } = req.body;
    const message = new Message({ chatId, senderId, text });
    const savedMessage = await message.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: "Failed to send message", error });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages", error });
  }
};
