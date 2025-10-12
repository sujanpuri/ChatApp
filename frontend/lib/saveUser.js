import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Saves user to Firestore if not already exists
 */
export const saveUserToFirestore = async (user) => {
  if (!user?.uid) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    // if user doesn't exist, create it
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
      });
      console.log("✅ New user saved to Firestore:", user.email);
    } else {
      console.log("ℹ️ User already exists:", user.email);
    }
  } catch (error) {
    console.error("❌ Error saving user:", error);
  }
};
