import axios from "axios";

const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chats`;

export const createOrGetChat = async (currentUserId, receiverId) => {
  try {
    const { data } = await axios.post(BASE_URL, { currentUserId, receiverId });
    return data; // contains chatId or chat object
  } catch (error) {
    console.error("Create chat error:", error);
    throw new Error("Failed to create or get chat");
  }
};
