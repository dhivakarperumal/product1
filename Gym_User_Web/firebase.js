// import { initializeApp } from "firebase/app";
// import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: "AIzaSyBWmmb55mNgWonR_awBD3C3JiMSVTEfCzM",
//   authDomain: "gyms-16e6d.firebaseapp.com",
//   projectId: "gyms-16e6d",
//   messagingSenderId: "108835387183",
//   appId: "1:108835387183:web:3a9e962bfa6e804d14d3da",
// };

// // 🔥 MAIN APP (Admin)
// const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const googleProvider = new GoogleAuthProvider();

// // 🔥 SECONDARY APP (for creating member auth without logout)
// const secondaryApp = initializeApp(firebaseConfig, "Secondary");
// export const secondaryAuth = getAuth(secondaryApp);

// export default app;


/**
 * Firebase was removed and migrated to MySQL backend
 * All authentication and data operations now use the API at /api
 */

// Stub exports for backwards compatibility during migration
export const auth = null;
export const db = null;
export const googleProvider = null;
export const secondaryAuth = null;

export default null;