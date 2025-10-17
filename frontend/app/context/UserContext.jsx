// /app/context/UserContext.jsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { auth, db } from "../../lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, getDocs, doc, setDoc } from "firebase/firestore"

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // 🧠 1️⃣ Listen for current user login/logout
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        }

        // Save user to Firestore (if not already saved)
        await setDoc(doc(db, "users", user.uid), userData, { merge: true })

        setCurrentUser(userData)
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // 🧠 2️⃣ Fetch all users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"))
        const usersList = querySnapshot.docs.map((doc) => doc.data())
        setAllUsers(usersList)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }
    fetchUsers()
  }, [currentUser])

  console.log("UserContext - All Users:", allUsers)
  console.log("UserContext - Current User:", currentUser)

  return (
    <UserContext.Provider value={{ currentUser, allUsers, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
