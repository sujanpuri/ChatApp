import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true },
    senderId: { type: String, required: true }, // Firebase UID
    text: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
