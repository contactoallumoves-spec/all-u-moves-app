import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración Real de Firebase (Extraída de tu captura)
const firebaseConfig = {
    apiKey: "AIzaSyCVeeO7sSa03s4IQJpLEVhvvd_EBaSF9BU",
    authDomain: "all-u-moves.firebaseapp.com",
    projectId: "all-u-moves",
    storageBucket: "all-u-moves.firebasestorage.app",
    messagingSenderId: "831589732343",
    appId: "1:831589732343:web:1685eb95479e95eb8de8f2",
    measurementId: "G-JCB2CJBMXN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
