import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

/**
 * Initiates Google OAuth Sign-in.
 * Falls back to mock authentication in development if keys are absent.
 */
export async function signInWithGoogle() {
  if (!isFirebaseConfigured) {
    console.warn("Firebase not configured. Simulating mock Google Sign-in...");
    // Return a mock token for local testing
    return {
      user: { email: 'mockuser@example.com', displayName: 'Mock User' },
      idToken: 'mock-token-mockuser@example.com'
    };
  }

  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return {
    user: result.user,
    idToken
  };
}

export default {
  signInWithGoogle
};
