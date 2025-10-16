"use client";

import { useState, useMemo } from "react";
import { useUser } from "@/app/context/UserContext";
import Navbar from "@/app/components/navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function UsersPage() {
  const { currentUser, allUsers, loading } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("a-z");
  const router = useRouter();

  const filteredUsers = useMemo(() => {
    let filtered = allUsers.filter(
      (u) =>
        (u.name || "anonymous")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortOption === "a-z") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortOption === "z-a") {
      filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }

    return filtered;
  }, [allUsers, searchTerm, sortOption]);

  const handleStartChat = async (receiverId) => {
    try {
      // const chat = await createOrGetChat(currentUser.uid, receiverId);
      // router.push(`/routes/Messages/${receiverId}`);
      router.push('#');
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  return (
    <div className="bg-white text-black min-h-screen">
      <Navbar />
      <div className="p-6">
        <div className="flex sm:flex-row items-center justify-between gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-1/2 p-1 border rounded-md focus:ring focus:ring-blue-300"
          />

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="p-2 border rounded-md bg-white text-gray-700"
          >
            <option value="a-z">A - Z</option>
            <option value="z-a">Z - A</option>
          </select>
        </div>

        <h2 className="text-lg text-black font-semibold mb-2">Users</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="space-y-3">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <li
                  key={u.uid}
                  onClick={() => handleStartChat(u.uid)}
                  className="p-3 rounded shadow flex items-center gap-3 hover:bg-gray-100 cursor-pointer transition"
                >
                  <Image
                    src={u.photoURL || "/images.png"}
                    alt={u.name || "Anonymous"}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-medium block">
                      {u.name || "Anonymous"}
                    </span>
                    <span className="text-sm text-gray-600">{u.email}</span>
                    <br />
                    <span className="text-xs text-gray-500">Id: {u.uid}</span>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-gray-600">No users found.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
