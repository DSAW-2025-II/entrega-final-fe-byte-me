import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Solo inicializar Firebase en el cliente
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

function initializeFirebase() {
  if (typeof window === "undefined") return;
  if (app) return; // Ya está inicializado

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "movetogether-e31d4.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Verificar que todas las variables de entorno estén presentes
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.warn("Firebase config incompleto. Algunas variables de entorno pueden estar faltando.");
    return;
  }

  try {
    // Initialize Firebase
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    
    // Configurar Storage con el bucket correcto
    const bucket = firebaseConfig.storageBucket;
    if (bucket) {
      storage = getStorage(app, bucket);
    } else {
      storage = getStorage(app);
    }
    
    googleProvider = new GoogleAuthProvider();

    googleProvider.setCustomParameters({
      prompt: "select_account",
    });
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
  }
}

// Inicializar cuando se carga el módulo (solo en cliente)
if (typeof window !== "undefined") {
  initializeFirebase();
}

export { auth, storage, googleProvider, initializeFirebase };

