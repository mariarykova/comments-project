import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD59QeLQb6s7wBW7uhRlxD4qNvU9EJcfyk",
  authDomain: "comments-project-aacc5.firebaseapp.com",
  projectId: "comments-project-aacc5",
  storageBucket: "comments-project-aacc5.appspot.com",
  messagingSenderId: "49298980080",
  appId: "1:49298980080:web:cdcd4626cfc6359b3dd635",
  measurementId: "G-XT0VRM1SYL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const firestore = getFirestore(app);

// Initialize Auth (явная инициализация)
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

export default app;
