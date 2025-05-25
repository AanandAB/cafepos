import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add scopes for Google Drive API access
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.appdata');

// Firebase authentication functions
export const signInWithGoogle = async () => {
  try {
    // Using redirect method is better for embedded environments like Replit
    // Display a message to the user with instructions
    alert("You'll be redirected to Google to sign in. Please add this domain to your Firebase authorized domains list if you encounter an 'unauthorized domain' error.");
    
    await signInWithRedirect(auth, googleProvider);
    return null; // Control will transfer to the redirect
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Handle redirect result when returning from Google auth
export const handleGoogleRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // Get Google access token for Google Drive API
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        const token = credential.accessToken;
        // Store the token for later use with Google Drive API
        if (token) {
          localStorage.setItem('google_drive_token', token);
          console.log("Google Drive token stored successfully");
        } else {
          console.warn("No access token received from Google");
        }
      } else {
        console.warn("No credential received from Google");
      }
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Error handling Google redirect:", error);
    // Check if the error is related to unauthorized domain
    if (error instanceof Error && error.message.includes("auth/unauthorized-domain")) {
      alert("This domain is not authorized in your Firebase project. Please add it to the authorized domains list in Firebase console.");
    }
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    localStorage.removeItem('google_drive_token');
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export { auth };