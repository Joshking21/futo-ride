import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export async function handleUserSignIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch the user's specific role document from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { 
        success: true, 
        uid: user.uid, 
        userType: userData.userType // Passes 'driver' or 'rider' back to the UI
      };
    }
    
    return { success: false, error: "User profile document not found" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}