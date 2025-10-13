"use client";
import { useUser } from "@/app/context/UserContext";
import Navbar from "@/app/components/navbar";
import Image from "next/image";

export default function UsersPage() {
  const { currentUser, allUsers, loading } = useUser();

  return (
    <div className="bg-white text-black min-h-screen">
      <Navbar />
      <div className="p-6">
        {loading ? (<p>Loading...</p>) : (
          <div>

          <h2 className="text-lg text-black font-semibold mb-2">Users</h2>
          <ul className="space-y-2">
            {allUsers.map((u) => (
              <li
                key={u.uid}
                className="p-3 rounded shadow flex items-center gap-3"
              >
                <Image src={u.photoURL || "/image.png"} alt={u.name} width={32} height={32} className="w-8 h-8 rounded-full" />
                <span >{u.name||"Anonymous"}</span>
              </li>
            ))}
          </ul>
          </div>
          )}
      </div>
    </div>
  );
}