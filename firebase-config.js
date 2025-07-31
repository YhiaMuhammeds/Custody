// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMxzOa5qv1yLuIjjiKXrhr9fcbF554340",
  authDomain: "custody-system.firebaseapp.com",
  projectId: "custody-system",
  storageBucket: "custody-system.appspot.com",
  messagingSenderId: "978447346271",
  appId: "1:978447346271:web:68ed95dc1598460e1849ea",
  measurementId: "G-MF7C0670B1"
};

// ✅ تهيئة التطبيق وقاعدة البيانات
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
