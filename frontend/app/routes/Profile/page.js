"use client";

import { useContext } from "react";
import { UserContext } from "@/app/context/UserContext";
import Image from "next/image";
import Navbar from "@/app/components/navbar";

export default function ProfilePage() {
  const { currentUser } = useContext(UserContext);

  if (!currentUser) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading user details...
      </div>
    );
  }

  return (
    <div className="bg-gray-200 min-h-screen">
      <Navbar />
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md mt-6">
        <div className="flex flex-col items-center gap-4">
          <Image
            src={currentUser.photoURL || "/image.png"}
            alt={currentUser.name || "User"}
            width={100}
            height={100}
            className="w-24 h-24 rounded-full object-cover"
          />
          <h2 className="text-xl font-bold text-gray-800">
            {currentUser.name || "Anonymous User"}
          </h2>
          <p className="text-gray-600">{currentUser.email}</p>
          <p className="text-gray-400 text-sm">
            Joined:{" "}
            {currentUser.createdAt?.toDate
              ? currentUser.createdAt.toDate().toLocaleDateString()
              : new Date(currentUser.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button className="w-full px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition">
            Edit Profile
          </button>
          <button className="w-full px-4 py-2 rounded border text-black border-gray-300 hover:bg-gray-100 transition">
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
