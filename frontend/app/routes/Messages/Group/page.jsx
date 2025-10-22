"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
// import { useToast, ToastProvider } from "../../../components/ui/sooner";
import Image from "next/image";

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
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertHeading, setAlertHeading] = useState("");
  const [searchMembers, setSearchMembers] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

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
      console.log("Fetched messages: ", res.data);
      socket.emit("joinRoom", activeChat.chatId); // join socket room
    };

    fetchMessages();
  }, [activeChat]);

  // --- Handle chat click ---
  const handleOpenChat = (chat) => {
    setActiveChat(chat);
    // Optional: navigate or open modal

    // Mark messages as read instantly (client-side)
    queryClient.invalidateQueries(["groupMessages"]);
  };

  // --- Send message ---
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const msgData = {
      chatId: activeChat.chatId,
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderImg: currentUser.photoURL,
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

      setAlertMessage(`✅ Group "${groupName}" created successfully!`);
      setAlertHeading("Group Created");
      setShowAlert(true);
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
  const addMembers = async (uid) => {
    if (!activeChat) return alert("Select a group first!");
    if (selectedUsers.length === 0) return alert("Select at least one user!");

    try {
      await API.put(`/chats/${activeChat.chatId}/add-members`, {
        members: selectedUsers,
      });

      alert("Members added successfully!");

      setSelectedUsers([]);
      setSearchMembers("");
      setOpen(false);

      // Refresh chat list
      queryClient.invalidateQueries(["userChats", currentUser.uid]);
    } catch (err) {
      console.error(err);
      alert("Failed to add members");
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!activeChat) return;

    // Scroll to bottom when chat loads
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300); // small delay to ensure messages are rendered
  }, [activeChat]);

  // Sort messages by createdAt (oldest to newest)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Filter users based on search and exclude already added members
  const filteredUsers = useMemo(() => {
    return allUsers?.filter((user) => {
      // Exclude current user
      if (user.uid === currentUser?.uid) return false;

      // Exclude users already in the group
      const isAlreadyMember = activeChat?.members?.includes(user.uid);
      console.log("isAlreadyMember: ", isAlreadyMember);
      if (isAlreadyMember) return false;

      // Search filter by name or email
      return (
        user.name?.toLowerCase().includes(searchMembers.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchMembers.toLowerCase())
      );
    });
  }, [allUsers, currentUser, searchMembers, activeChat]);

  // Toggle user selection
  const toggleSelect = (uid) => {
    setSelectedUsers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  // --- Typing indicator ---
  useEffect(() => {
    socket.on("userTyping", (user) => {
      setTypingUsers((prev) => {
        const exists = prev.find((u) => u.userId === user.userId);
        if (exists) return prev;
        return [...prev, user];
      });
    });

    socket.on("userStopTyping", (user) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== user.userId));
    });

    return () => {
      socket.off("userTyping");
      socket.off("userStopTyping");
    };
  }, []);

  let typingTimeout;

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // Emit typing
    socket.emit("typing", {
      chatId,
      userId: currentUser._id,
      name: currentUser.name,
      image: currentUser.image,
    });

    // Stop typing after 1 second of no input
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId,
        userId: currentUser._id,
        name: currentUser.name,
        image: currentUser.image,
      });
    }, 1000);
  };

  // --- Mark messages as seen ---
  useEffect(() => {
    if (!activeChat || !currentUser) return; // <-- guard

    const markSeen = async () => {
      try {
        await API.post("/messages/seen", {
          chatId: activeChat.chatId,
          userId: currentUser.uid,
        });

        socket.emit("messageSeen", {
          chatId: activeChat.chatId,
          userId: currentUser.uid,
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId !== currentUser.uid &&
            !msg.seenBy.includes(currentUser.uid)
              ? { ...msg, seenBy: [...msg.seenBy, currentUser.uid] }
              : msg
          )
        );
      } catch (err) {
        console.error("Error marking messages seen:", err);
      }
    };

    markSeen();
  }, [messages, activeChat, currentUser]);

  // --- Listen for seen updates from socket ---
  useEffect(() => {
    const handleSeenUpdate = ({ userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          !msg.seenBy.includes(userId)
            ? { ...msg, seenBy: [...msg.seenBy, userId] }
            : msg
        )
      );
    };

    socket.on("updateSeen", handleSeenUpdate);

    return () => {
      socket.off("updateSeen", handleSeenUpdate);
    };
  }, []);

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
                    <div className="flex items-center gap-3">
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <button className="flex items-center bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-md hover:scale-105 transition-transform duration-200">
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
                        </PopoverTrigger>

                        <PopoverContent className="w-72 bg-white dark:bg-neutral-900 shadow-lg rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                          <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                            Select Users
                          </h3>

                          {/* Search Input */}
                          <input
                            type="text"
                            placeholder="Search user..."
                            value={searchMembers}
                            onChange={(e) => setSearchMembers(e.target.value)}
                            className="w-full mb-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-neutral-800 dark:border-gray-700 dark:text-gray-200"
                          />

                          {/* User List */}
                          <div className="max-h-48 overflow-y-auto space-y-2">
                            {filteredUsers?.length > 0 ? (
                              filteredUsers.map((user) => {
                                const isSelected = selectedUsers.includes(
                                  user.uid
                                );
                                return (
                                  <button
                                    key={user.uid}
                                    onClick={() => toggleSelect(user.uid)}
                                    className={`flex items-center gap-3 w-full text-left px-2 py-2 rounded-lg transition ${
                                      isSelected
                                        ? "bg-green-100 dark:bg-green-800"
                                        : "hover:bg-green-50 dark:hover:bg-neutral-800"
                                    }`}
                                  >
                                    <Image
                                      src={user.photoURL}
                                      alt={user.name}
                                      width={32}
                                      height={32}
                                      className="rounded-full"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                        {user.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {user.email}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                );
                              })
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                No users found
                              </p>
                            )}
                          </div>

                          {/* Add Selected Button */}
                          {selectedUsers.length > 0 && (
                            <button
                              onClick={addMembers}
                              className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                            >
                              Add {selectedUsers.length} Member
                              {selectedUsers.length > 1 ? "s" : ""}
                            </button>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
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
                              {/* Sender name and photo */}
                              <div className="flex items-center text-xs mb-1 font-medium">
                                <Image
                                  src={
                                    isMine
                                      ? currentUser?.photoURL ||
                                        "/default-avatar.png"
                                      : msg.senderImg || "/default-avatar.png"
                                  }
                                  alt={
                                    isMine
                                      ? currentUser?.name || "You"
                                      : msg.senderName || "User"
                                  }
                                  width={20}
                                  height={20}
                                  className="rounded-full mr-2"
                                />
                                <span
                                  className={
                                    isMine ? "text-blue-100" : "text-gray-600"
                                  }
                                >
                                  {isMine
                                    ? currentUser?.name || "You"
                                    : msg.senderName || "User"}
                                  {/* {console.log("message details: ", msg)}s */}
                                </span>
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

                              {/* Seen messages as avatars */}
                              {msg.seenBy?.length > 1 && (
                                <div className="flex justify-end mt-1 space-x-1">
                                  {msg.seenBy
                                    .filter((uid) => uid !== currentUser.uid) // exclude yourself
                                    .map((uid) => {
                                      const user = allUsers.find(
                                        (u) => u.uid === uid
                                      );
                                      return (
                                        <Image
                                          key={uid}
                                          src={
                                            user?.photoURL ||
                                            "/default-avatar.png"
                                          } // fallback if no photo
                                          alt={user?.name || "User"}
                                          width={16}
                                          height={16}
                                          className="rounded-full"
                                        />
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* 🟢 Typing indicator */}
                      {typingUsers.length > 0 && (
                        <div className="flex gap-2 mt-2 items-center">
                          {typingUsers.map((u) => (
                            <div
                              key={u.userId}
                              className="flex items-center gap-2"
                            >
                              <img
                                src={u.image}
                                alt={u.name}
                                className="w-5 h-5 rounded-full object-cover border"
                              />
                              <p className="text-xs text-gray-500">
                                {u.name} is typing...
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

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
                {chats?.map((chat) => (
                  <li
                    key={chat.chatId}
                    onClick={() => handleOpenChat(chat)}
                    className="p-3 rounded-lg shadow cursor-pointer flex justify-between items-center transition hover:bg-blue-100 bg-white"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        {chat.name}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {showAlert && (
        <div className="fixed flex flex-col bottom-4 right-4 bg-amber-300 text-white px-4 py-2 rounded shadow-lg">
          <span>{alertHeading}</span>
          <span>{alertMessage}</span>
        </div>
      )}
    </div>
  );
}
