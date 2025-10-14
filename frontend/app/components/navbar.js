"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "../context/UserContext";
import Image from "next/image";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser } = useUser();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navLinks = [
    { name: "Users", href: "/routes/Users", icon: UsersIcon },
    { name: "Messages", href: "/routes/Messages", icon: MessageIcon },
  ];

  const profileMenu = [
    { name: "View Profile", href: "/routes/Profile", icon: ProfileIcon },
    { name: "Edit Profile", href: "#", icon: EditIcon },
    { name: "Settings", href: "#", icon: SettingsIcon },
  ];

  // console.log("Current User in Navbar:", currentUser);

  return (
    <div className="bg-white text-gray-900">
      <header className="flex justify-between items-center h-16 px-6 border-b bg-gray-100 shadow-sm">
        {/* Left: Navigation */}
        <nav className="flex gap-4">
          {navLinks.map(({ name, href, icon: Icon }) => (
            <Link
              key={name}
              href={href}

              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm font-semibold ${
                pathname === href
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
              }`}
            >
              <Icon />
              {name}
            </Link>
          ))}
        </nav>

        {/* Right: Profile Dropdown */}
        <div className="relative">
          {/* Profile Avatar details */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-100 transition-all"
          >
            <div className="text-right text-sm">
              <p className="font-semibold">{currentUser?.name || "Anonymous"}</p>
              <p className="text-xs text-gray-500">{currentUser?.email || "No Email"}</p>
            </div>
            <Image src={currentUser?.photoURL || "/image.png"} alt="Avatar" width={32} height={32} className="rounded-full object-cover" />
            <svg
              className={`w-4 h-4 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-md z-10">
              {profileMenu.map(({ name, href, icon: Icon }) => (
                <Link
                  key={name}
                  href={href}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                >
                  <Icon /> {name}
                </Link>
              ))}

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 w-full text-sm text-red-600 hover:bg-red-50 border-t"
              >
                <LogoutIcon /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

/* ------------------ SVG ICONS ------------------ */

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MessageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
