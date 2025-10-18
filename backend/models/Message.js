import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderImg: {
      type: String,
    },
    text: {
      type: String,
      required: true,
    },
    seenBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
