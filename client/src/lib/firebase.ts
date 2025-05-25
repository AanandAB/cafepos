import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
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
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline'
});

// Firebase authentication functions
export const signInWithGoogle = async () => {
  try {
    // Using popup method for better user experience
    const result = await signInWithPopup(auth, googleProvider);
    
    // Get Google access token for Google Drive API
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential) {
      const token = credential.accessToken;
      // Store the token for later use with Google Drive API
      if (token) {
        localStorage.setItem('google_drive_token', token);
        console.log("Google Drive token stored successfully");
        
        // Store token expiry time (typically 1 hour from now)
        const expiryTime = Date.now() + (60 * 60 * 1000);
        localStorage.setItem('google_drive_token_expiry', expiryTime.toString());
        
        // Also store the ID token as it might be needed for some operations
        if (result.user) {
          result.user.getIdToken().then(idToken => {
            localStorage.setItem('google_id_token', idToken);
          });
        }
      } else {
        console.warn("No access token received from Google");
        alert("Failed to get access token from Google. Please ensure you grant all requested permissions.");
      }
    } else {
      console.warn("No credential received from Google");
      alert("Failed to get credentials from Google. Please try again and ensure you grant all requested permissions.");
    }
    
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    // Check if the error is related to unauthorized domain
    if (error instanceof Error && error.message.includes("auth/unauthorized-domain")) {
      alert("This domain is not authorized in your Firebase project. Please add it to the authorized domains list in Firebase console.");
    } else {
      // Show a more user-friendly error message
      alert("Google sign in failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
    throw error;
  }
};

// Handle redirect result for backward compatibility
export const handleGoogleRedirect = async () => {
  // Just check if we have a token
  const token = localStorage.getItem('google_drive_token');
  if (token) {
    return { uid: 'google-user' }; // Return a minimal user object
  }
  return null;
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