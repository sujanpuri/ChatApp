import Message from "../models/Message.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, senderId, senderName, senderImg, text } = req.body;

    if (!chatId || !senderId || !senderName || !senderImg || !text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const message = await Message.create({
      chatId,
      senderId,
      senderName,
      senderImg,
      text,
    });
    console.log("Message sent: ", message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages of a specific chat
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    // console.log(`Messages for chat: `, messages);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Mark messages as seen
export const markMessagesSeen = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    // Add userId to all unseen messages in this chat
    await Message.updateMany(
      { chatId, seenBy: { $ne: userId } },
      { $push: { seenBy: userId } }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Mark messages seen error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};