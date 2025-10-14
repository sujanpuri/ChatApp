import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: {
      type: [String], // store user IDs (from Firebase)
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
