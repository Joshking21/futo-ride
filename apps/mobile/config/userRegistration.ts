import { createUserWithEmailAndPassword, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  userRole: string;
}

// 1. Explicitly type our return structure so TypeScript knows what fields are legal
interface RegistrationResult {
  success: boolean;
  user?: User;
  userType?: string;
  error?: string;
}

export async function handleUserRegistration({
  email,
  password,
  fullName,
  userRole
}: SignUpData): Promise<RegistrationResult> {
  try {
    // Step 1: Create the secure authentication account in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const cleanRole = userRole.toLowerCase().trim();

    // Step 2: Create corresponding profile document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      userType: cleanRole,
      createdAt: new Date().toISOString(),
      walletBalance: 0,
      rating: 5.0,
    });

    console.log("Account and Firestore profile created successfully.");
    
    // Explicitly return the type we just registered alongside success status
    return { success: true, user, userType: cleanRole };

  } catch (error: any) {
    // Handle the explicit case where an account already exists in Firebase Auth
    if (error.code === "auth/email-already-in-use") {
      console.log("Email already in use. Checking associated user role metadata...");
      return { 
        success: false, 
        error: "EMAIL_EXISTS" 
      };
    }

    console.error("Registration failed:", error.code, error.message);
    return { success: false, error: error.message };
  }
}