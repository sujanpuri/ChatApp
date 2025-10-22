import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../config/db.js";
import chatRoutes from "../routes/chatRoutes.js";
import messageRoutes from "../routes/messageRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // frontend URL here
    methods: ["GET", "POST"],
  },
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("⚡ User connected: ", socket.id);

  // Join a chat room
  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined room ${chatId}`);
  });

  // Send message
  socket.on("sendMessage", (data) => {
    // data = { chatId, senderId, text }
    io.to(data.chatId).emit("receiveMessage", data);
  });

  // Typing indicator
  socket.on("typing", ({ chatId, userId, name, image }) => {
    socket.to(chatId).emit("userTyping", { userId, name, image });
  });
  socket.on("stopTyping", ({ chatId, userId, name, image }) => {
    socket.to(chatId).emit("userStopTyping", { userId, name, image });
  });

  // Real-time message seen
  socket.on("messageSeen", async ({ chatId, userId }) => {
    const Message = (await import("../models/Message.js")).default;

    await Message.updateMany(
      { chatId, seenBy: { $ne: userId } },
      { $push: { seenBy: userId } }
    );

    socket.to(chatId).emit("updateSeen", { chatId, userId });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected: ", socket.id);
  });
});

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Group Chat Backend is Running ✅");
});

export default app;