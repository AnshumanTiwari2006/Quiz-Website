import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeIPDvbxcUCzsN5vE_f96PukpitjIHAR0",
  authDomain: "scholar-synergy.firebaseapp.com",
  projectId: "scholar-synergy",
  storageBucket: "scholar-synergy.firebasestorage.app",
  messagingSenderId: "626942309974",
  appId: "1:626942309974:web:87e6ec3235633ff76dedf7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;