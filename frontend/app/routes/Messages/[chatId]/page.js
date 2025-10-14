"use client";

import { useParams } from "next/navigation";
import ChatBox from "@/app/components/ChatBox";
import { useUser } from "@/app/context/UserContext";

export default function ChatPage() {
  const { chatId } = useParams();
  const { currentUser } = useUser();

  return (
    <div className="bg-white text-black min-h-screen flex flex-col">
      <header className="p-4 border-b text-lg font-semibold">
        Chat Room – {chatId}
      </header>

      <div className="flex-1">
        <ChatBox currentUser={currentUser} chatId={chatId} />
      </div>
    </div>
  );
}
