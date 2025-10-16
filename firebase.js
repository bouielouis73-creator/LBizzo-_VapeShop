// ---------- Firebase Config ----------
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.appspot.com",
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
};

// ---------- Initialize ----------
firebase.initializeApp(firebaseConfig);
console.log("🔥 Firebase initialized");

// Optional global access
window.db = firebase.firestore();
window.storage = firebase.storage();
