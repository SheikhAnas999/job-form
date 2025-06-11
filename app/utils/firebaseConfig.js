// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAC1MuDC9432QOthIprAxTmiDs0C73CTmk",
  authDomain: "job-portal-dae57.firebaseapp.com",
  projectId: "job-portal-dae57",
  storageBucket: "job-portal-dae57.firebasestorage.app",
  messagingSenderId: "329678204935",
  appId: "1:329678204935:web:75aef834843c6052fefaa2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 