import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// You can copy this from Firebase Console -> Project Settings -> General -> Your apps
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAt4MTODt0UDc93IShBtykgWkFHp8kmkZ8",
    authDomain: "docaitoplabs.firebaseapp.com",
    projectId: "docaitoplabs",
    storageBucket: "docaitoplabs.firebasestorage.app",
    messagingSenderId: "139710836642",
    appId: "1:139710836642:web:677a2e499fecbb13210cfb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// [IMPORTANT] Enforce Session Persistence to allow multi-tab roles (Evaluator Mode)
setPersistence(auth, browserSessionPersistence)
    .then(() => {
        console.log("Firebase Auth: Persistence set to SESSION (Tab-Isolated).");
    })
    .catch((error) => {
        console.error("Firebase Auth Error:", error);
    });

export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
