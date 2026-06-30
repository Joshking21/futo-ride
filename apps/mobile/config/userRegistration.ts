// import { useApp } from "@/context/AppContext";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  userRole: string;
  //   username: string;
}

// const { userRole } = useApp();

export async function handleUserRegistration({
  email,
  password,
  fullName,
  userRole
}: SignUpData) {
  try {
    // Step 1: Create the secure authentication account in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Step 2: Create a corresponding profile document in the Firestore 'users' collection
    // We name the document exactly after the user's unique Auth UID to link them perfectly
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      //   username: username.toLowerCase().trim(),
      userType: userRole.toLowerCase().trim(),
      createdAt: new Date().toISOString(),
      walletBalance: 0, // Great baseline field for a ride app
      rating: 5.0, // Great baseline field for drivers/riders
    });

    console.log(
        "Account and Firestore profile created successfully for:",
        //   user.uid,
        //   user,
        userCredential
    );
    return { success: true, user };
  } catch (error: any) {
    console.error("Registration failed:", error.code, error.message, error);
    throw new Error(error.message);
  }
}

// export async function handleSignIn(email: string, password: string) {
//   try {
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;
//     console.log("Signed in user UID:", user.uid);
//   } catch (error:any) {
//     console.error("Sign in error code:", error.code, error.message);
//   }
// }

// export async function handleSignOut() {
//   try {
//     await signOut(auth);
//     console.log("Signed out successfully");
//   } catch (error:any) {
//     console.error("Sign out error code:", error.code, error.message);
//   }
// }

// export async function handleResetPassword(email: string) {
//   try {
//     await sendPasswordResetEmail(auth, email);
//     console.log("Password reset email sent");
//   } catch (error:any) {
//     console.error("Password reset error code:", error.code, error.message);
//   }
// }

// export async function handleUpdatePassword(password: string) {
//   try {
//     const user = auth.currentUser;
//     if (user) {
//       await updatePassword(user, password);
//       console.log("Password updated successfully");
//     }
//   } catch (error:any) {
//     console.error("Password update error code:", error.code, error.message);
//   }
// }

// export async function handleUpdateEmail(email: string) {
//   try {
//     const user = auth.currentUser;
//     if (user) {
//       await updateEmail(user, email);
//       console.log("Email updated successfully");
//     }
//   } catch (error:any) {
//     console.error("Email update error code:", error.code, error.message);
//   }
// }
