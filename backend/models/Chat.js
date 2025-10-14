import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    members: {
      type: [String], // Array of Firebase UIDs
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
