"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "../../../context/UserContext";
import API from "../../../../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { socket } from "../../../../lib/socket";
import Navbar from "../../../components/navbar";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { Plus, Users } from "lucide-react";
import { Toaster } from "sonner";

export default function MessagesPage() {
  const { currentUser, allUsers } = useUser();
  const queryClient = useQueryClient();
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messageEndRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState("");

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
  // 🧩 Create Group Chat Function
  const createChat = async () => {
    if (!groupName) return alert("Please enter a group name!");

    const memberList = members
      ? members.split(",").map((uid) => uid.trim())
      : [];

    // Always include the current user
    if (currentUser?.uid && !memberList.includes(currentUser.uid)) {
      memberList.push(currentUser.uid);
    }

    try {
      await API.post("/chats", {
        name: groupName,
        createdBy: currentUser?.uid,
        members: memberList,
      });

      alert(`✅ Group "${groupName}" created successfully!`);
      setOpen(false);
      setGroupName("");
      setMembers("");

      queryClient.invalidateQueries(["userChats", currentUser?.uid]);
    } catch (err) {
      console.error("❌ Failed to create group:", err);
      alert("Failed to create group. Try again!");
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

  const handleClick = () => {
    setShowAlert(true); // show the alert
    setTimeout(() => setShowAlert(false), 3000); // auto-hide after 3 sec
  };

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
                    {/* Left side: Back + Chat name */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActiveChat(null)} // back action
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      <h2 className="font-bold text-lg text-gray-800">
                        {activeChat.name}
                      </h2>
                    </div>

                    {/* Right side: Add Members button */}
                    <button
                      onClick={addMembers}
                      className="flex items-center bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-md hover:scale-105 transition-transform duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Members
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col p-4 h-[78vh] mb-2 rounded-lg bg-white">
                    {/* Messages scrollable area */}
                    <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar mb-4">
                      {sortedMessages.map((msg, idx) => {
                        const isMine = msg.senderId === currentUser?.uid;

                        let timeAgo = "Just now";
                        try {
                          if (
                            msg.createdAt &&
                            !isNaN(new Date(msg.createdAt))
                          ) {
                            timeAgo = formatDistanceToNow(
                              new Date(msg.createdAt),
                              {
                                addSuffix: true,
                              }
                            );
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

                      <div ref={messageEndRef} />
                    </div>

                    {/* Input box fixed at bottom of container */}
                    <div className="flex mt-auto">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 border p-2 rounded mr-2 outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="Type a message..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") sendMessage();
                        }}
                      />
                      <button
                        onClick={sendMessage}
                        className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600 transition"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500">
                  Select a group to start chatting
                </div>
              )}
            </div>
          ) : (
            <div className="w-screen p-4 bg-gray-50">
              {/* Header: Search + Create Group */}
              <div className="flex items-center justify-between mb-4">
                {/* Search bar */}
                <div className="flex items-center w-3/4 bg-white rounded-lg shadow px-3 py-2">
                  <Search className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* ✅ Popover Create Group */}
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition">
                      <Plus size={18} />
                      Create
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="w-80 bg-white border shadow-lg p-4 rounded-lg space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Create New Group
                    </h3>

                    <div>
                      <label className="text-sm text-gray-600">
                        Group Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter group name"
                        className="w-full text-black border rounded p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={createChat}
                      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                    >
                      Create Group
                    </button>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Group list */}
              <ul className="space-y-2">
                {chats
                  ?.filter((chat) =>
                    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((chat) => (
                    <li
                      key={chat.chatId}
                      onClick={() => setActiveChat(chat)}
                      className={`p-3 bg-white rounded-lg shadow hover:bg-blue-50 cursor-pointer flex justify-between items-center transition ${
                        activeChat?.chatId === chat.chatId ? "bg-blue-100" : ""
                      }`}
                    >
                      <div className="font-semibold">{chat.name}</div>

                      {/* Optional: add last message or unread badge here */}
                    </li>
                  ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
