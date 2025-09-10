// firebase-init.js  (cole como arquivo novo)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  push,
  remove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcvapiGZP36VijdD-wgcxCrPPine0_4rI",
  authDomain: "diary-4ae69.firebaseapp.com",
  databaseURL: "https://diary-4ae69-default-rtdb.firebaseio.com",
  projectId: "diary-4ae69",
  storageBucket: "diary-4ae69.firebasestorage.app",
  messagingSenderId: "412147866067",
  appId: "1:412147866067:web:b163ade0d1f8453d987726",
  measurementId: "G-EN0YJXHTQQ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// expõe globalmente para o resto do código (script.js)
window.db = db;
window.fb = { ref, get, set, update, push, remove };

// opcional: console.log pra confirmar carregou
console.log("Firebase inicializado (firebase-init.js)", { dbLoaded: !!window.db });
