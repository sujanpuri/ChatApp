"use client";
import { useUser } from "@/app/context/UserContext";
import ChatBox from "@/app/components/ChatBox";
import Navbar from "@/app/components/navbar";

export default function ChatPage() {
  const { currentUser } = useUser();

  // console.log("Messages Page - Current User:", currentUser);
  // Example chatId — in real app, get it from chat list or create when opening chat
  const chatId = currentUser.uid; // unique id or fetched from backend

  if (!currentUser) return <p>Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-200">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg h-[80vh]">
          <ChatBox currentUser={currentUser} chatId={chatId} />
        </div>
      </div>
    </div>
  );
}
