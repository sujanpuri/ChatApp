"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage, getMessages } from "../api/messageApi";
import { socket } from "@/lib/socket";

export default function ChatBox({ currentUser, chatId }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  console.log("ChatBox chatId:", chatId);
  // Fetch old messages
  const { data } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getMessages(chatId),
    enabled: !!chatId,
  });

  // Update messages when loaded
  useEffect(() => {
    if (data) setMessages(data);
  }, [data]);

  // Join chat room
  useEffect(() => {
    if (chatId) socket.emit("join_chat", chatId);
  }, [chatId]);

  // Receive messages in real-time
  useEffect(() => {
    socket.on("receive_message", (msg) => {
      if (msg.chatId === chatId) setMessages((prev) => [...prev, msg]);
    });
    return () => socket.off("receive_message");
  }, [chatId]);

  // Send message mutation
  const { mutate: sendMsg } = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      setMessages((prev) => [...prev, data]);
      socket.emit("send_message", data);
      queryClient.invalidateQueries(["messages", chatId]);
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    const newMsg = { chatId, senderId: currentUser.uid, text };
    sendMsg(newMsg);
    setText("");
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-3 bg-gray-100 p-2 rounded-xl">
        {messages.map((m) => (
          <div
            key={m._id}
            className={`my-1 p-2 rounded-xl max-w-xs ${
              m.senderId === currentUser.uid
                ? "bg-blue-500 text-white self-end ml-auto"
                : "bg-white text-black self-start"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          className="flex-1 border border-gray-400 rounded-xl p-2"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl"
        >
          Send
        </button>
      </div>
    </div>
  );
}
