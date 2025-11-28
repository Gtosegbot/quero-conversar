import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBwc9M6Na7hRJDMD6PxRxM6bjkcilAobZQ",
    authDomain: "quero-conversar-app.firebaseapp.com",
    projectId: "quero-conversar-app",
    storageBucket: "quero-conversar-app.firebasestorage.app",
    messagingSenderId: "830373643130",
    appId: "1:830373643130:web:51e072ca1e097bd8e70cc3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

export default app;
