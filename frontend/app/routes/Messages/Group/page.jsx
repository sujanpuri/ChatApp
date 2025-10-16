"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@/app/context/UserContext";
import API from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import Navbar from "@/app/components/navbar";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messageEndRef = useRef(null);

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
      senderName: currentUser.name,
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sort messages by createdAt (oldest to newest)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  console.log("messsages", messages);
  return (
    <div className="flex min-h-screen bg-gray-200 text-black">
      <div className="flex flex-col min-w-screen h-screen">
        <Navbar />

        <div className="flex">

          {activeChat ? (
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

                <div className="flex-1 overflow-y-auto border p-4 mb-2 rounded-lg bg-white scroll-smooth">
                  {sortedMessages.map((msg, idx) => {
                    const isMine = msg.senderId === currentUser?.uid;

                    // ✅ Safe timestamp handling (no crash)
                    let timeAgo = "Just now";
                    try {
                      if (msg.createdAt && !isNaN(new Date(msg.createdAt))) {
                        timeAgo = formatDistanceToNow(new Date(msg.createdAt), {
                          addSuffix: true,
                        });
                      }
                    } catch (err) {
                      timeAgo = "Just now";
                    }

                    return (
                      <div
                        key={idx}
                        className={`mb-3 flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl shadow-md relative group transition-all duration-200 ${
                            isMine
                              ? "bg-blue-500 text-white rounded-br-none"
                              : "bg-gray-200 text-black rounded-bl-none"
                          }`}
                        >
                          {/* Sender name */}
                          <div
                            className={`text-xs mb-1 font-medium ${
                              isMine ? "text-blue-100" : "text-gray-600"
                            }`}
                          >
                            {isMine
                              ? currentUser?.name || "You"
                              : msg.senderName || "User"}
                          </div>

                          {/* Message text */}
                          <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {msg.text}
                          </div>

                          {/* Time sent */}
                          <div
                            className={`text-[10px] mt-1 text-right ${
                              isMine ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {timeAgo}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty div to auto-scroll to bottom */}
                  <div ref={messageEndRef} />
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
          </div>) : (
          <div className="w-screen border-r p-4">
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
          </div>)}


        </div>
      </div>
    </div>
  );
}
