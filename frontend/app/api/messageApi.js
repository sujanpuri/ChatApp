import axios from "axios";

const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages`;

export const sendMessage = async (messageData) => {
  try {
    const { data } = await axios.post(BASE_URL, messageData);
    return data;
  } catch (error) {
    console.error("Send message error:", error);
    throw new Error("Failed to send message");
  }
};

export const getMessages = async (chatId) => {
  try {
    console.log("The chat id is: ", chatId);
    const { data } = await axios.get(`${BASE_URL}/${chatId}`);
    return data;
  } catch (error) {
    console.error("Fetch messages error:", error);
    throw new Error("Failed to fetch messages");
  }
};
