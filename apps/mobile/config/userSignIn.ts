import { signInWithEmailAndPassword } from "firebase/auth";
// Make sure 'auth' is imported from your local firebaseConfig file
import { auth } from "./firebaseConfig"; 

export async function handleUserSignIn(email: string, password: string) {
  try {
    // Pass credentials directly to Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.toLowerCase().trim(),
      password
    );
    
    const user = userCredential.user;
    console.log("User signed in successfully! UID:", user.uid);
    
    // Return success status and the user token payload
    return { success: true, user };
  } catch (error: any) {
    console.error("Sign in failed:", error.code, error.message);
    throw new Error(error.message);
  }
}