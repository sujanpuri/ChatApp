"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";
import API from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import Navbar from "@/app/components/navbar";

export default function MessagesPage() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // --- Fetch user's group chats ---
  const { data: chats } = useQuery({
    queryKey: ["userChats", currentUser?.uid],
    queryFn: async () => {
      const res = await API.get(`/chats/${currentUser.uid}`);
      return res.data;
    },
    enabled: !!currentUser?.uid,
  });

  // --- Fetch messages of active chat ---
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      const res = await API.get(`/messages/${activeChat.chatId}`);
      setMessages(res.data);
      socket.emit("joinRoom", activeChat.chatId); // join socket room
    };

    fetchMessages();
  }, [activeChat]);

  // --- Listen for new messages ---
  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (activeChat && msg.chatId === activeChat.chatId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [activeChat]);

  // --- Send message ---
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const msgData = {
      chatId: activeChat.chatId,
      senderId: currentUser.uid,
      text: newMessage,
    };

    try {
      await API.post("/messages", msgData); // save to DB
      socket.emit("sendMessage", msgData); // emit via socket
      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  // --- Create new group chat ---
  const createChat = async () => {
    const name = prompt("Enter group name:");
    if (!name) return;

    try {
      await API.post("/chats", {
        name,
        createdBy: currentUser?.uid,
        members: [currentUser?.uid],
      });
      queryClient.invalidateQueries(["userChats", currentUser?.uid]);
    } catch (err) {
      console.error(err);
    }
  };

  // Add this function inside MessagesPage component
  const addMembers = async () => {
    if (!activeChat) return alert("Select a group first!");

    // Ask for comma-separated uids
    const input = prompt("Enter user IDs to add (comma separated):");
    if (!input) return;

    const newMembers = input.split(",").map((uid) => uid.trim());
    if (!newMembers.length) return;

    try {
      await API.put(`/chats/${activeChat.chatId}/add-members`, {
        members: newMembers,
      });
      alert("Members added successfully!");

      // Refresh chat list
      queryClient.invalidateQueries(["userChats", currentUser.uid]);
    } catch (err) {
      console.error(err);
      alert("Failed to add members");
    }
  };

  console.log("messsages", messages);
  return (
    <div className="flex min-h-screen bg-gray-200 text-black">
      <div className="flex flex-col min-w-screen h-screen">
        <Navbar />

        <div className="flex">
          {/* Sidebar: list of group chats */}
          <div className="w-1/4 border-r p-4">
            <button
              className="mb-4 bg-blue-500 text-white p-2 rounded"
              onClick={createChat}
            >
              + Create Group
            </button>
            <ul>
              {chats?.map((chat) => (
                <li
                  key={chat.chatId}
                  className={`p-2 cursor-pointer ${
                    activeChat?.chatId === chat.chatId ? "bg-gray-200" : ""
                  }`}
                  onClick={() => setActiveChat(chat)}
                >
                  {chat.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat window */}
          <div className="flex-1 p-4 flex flex-col h-[90vh]">
            {activeChat ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold mb-2">{activeChat.name}</h2>
                  <button
                    className="mb-2 bg-green-500 text-white p-2 rounded"
                    onClick={addMembers}
                  >
                    + Add Members
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto border p-2 mb-2">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`mb-2 ${
                        msg.senderId === currentUser?.uid
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      <span className="px-2 py-1 rounded bg-gray-300 inline-block">
                        <div>{msg.senderId === currentUser?.uid ? currentUser?.name : msg.senderId}</div>
                        {msg.text}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 border p-2 rounded mr-2"
                    placeholder="Type a message"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-blue-500 text-white px-4 rounded"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="text-gray-500">
                Select a group to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
