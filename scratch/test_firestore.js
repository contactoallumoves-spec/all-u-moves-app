import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCVeeO7sSa03s4IQJpLEVhvvd_EBaSF9BU",
    authDomain: "all-u-moves.firebaseapp.com",
    projectId: "all-u-moves",
    storageBucket: "all-u-moves.firebasestorage.app",
    messagingSenderId: "831589732343",
    appId: "1:831589732343:web:1685eb95479e95eb8de8f2",
    measurementId: "G-JCB2CJBMXN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    console.log("Conectando a Firestore...");
    try {
        const querySnapshot = await getDocs(collection(db, "patients"));
        console.log(`Total pacientes encontrados: ${querySnapshot.size}`);
        
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            console.log(`ID: ${docSnap.id} | Nombre: ${data.firstName} ${data.lastName} | RUT: ${data.rut}`);
        });

        // Intentar buscar duplicados de Bristela Parraguez (RUT 8.540.389-3)
        const bristelas = querySnapshot.docs.filter(docSnap => {
            const data = docSnap.data();
            return data.rut === '8.540.389-3' || (data.firstName && data.firstName.toLowerCase().includes('bristela'));
        });

        console.log(`\nEncontradas ${bristelas.length} fichas para Bristela.`);

        if (bristelas.length > 1) {
            console.log("\nIntentando eliminar duplicados (dejando solo la primera)...");
            for (let i = 1; i < bristelas.length; i++) {
                const docId = bristelas[i].id;
                console.log(`Eliminando duplicado con ID: ${docId}`);
                await deleteDoc(doc(db, "patients", docId));
                console.log(`Duplicado ${docId} eliminado con éxito.`);
            }
        }
    } catch (error) {
        console.error("Error al interactuar con Firestore:", error);
    }
}

run();
