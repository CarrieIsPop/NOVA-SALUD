// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCANotHOctlg_NkJT6TdO_WVrLCO1Cnoe8",
  authDomain: "farmaplus-web.firebaseapp.com",
  projectId: "farmaplus-web",
  storageBucket: "farmaplus-web.firebasestorage.app",
  messagingSenderId: "816896436220",
  appId: "1:816896436220:web:608a3cb913644cedb9b479",
  measurementId: "G-VE9P8ZXZYP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const analytics = getAnalytics(app);