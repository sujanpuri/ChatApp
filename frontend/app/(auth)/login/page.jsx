"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveUserToFirestore } from "../../../lib/saveUser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await saveUserToFirestore(userCredential.user); // 👈 Save user
      alert("Login successful!");
      router.push("/");
    } catch (err) {
      alert(err.message);
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserToFirestore(result.user); // 👈 Save user
      router.push("/");
    } catch (err) {
      console.error("Google login error:", err);
      setError("Failed to sign in with Google");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Welcome Back 👋
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-black px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-black px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-xl hover:bg-blue-700 transition-all"
          >
            Login
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition-all"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>

        <p className="text-center text-gray-600 text-sm mt-6">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
