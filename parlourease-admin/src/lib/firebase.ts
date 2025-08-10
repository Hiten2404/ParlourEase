import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "parlourease",
  appId: "1:964259509844:web:2522de97077cefb4589fc1",
  storageBucket: "parlourease.firebasestorage.app",
  apiKey: "AIzaSyDBZ9vRd9ZvZzB7min4UmJROuQ4tFo_Qvc",
  authDomain: "parlourease.firebaseapp.com",
  messagingSenderId: "964259509844",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistent local cache (works across refreshes and offline)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export { app, db };
