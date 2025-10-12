"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Navbar from "./components/navbar";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else router.push("/login");
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar/>
    </div>
  );
}
