// -------------------- LBizzo Vape Shop Firebase Config --------------------
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.appspot.com",
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
  databaseURL: "https://lbizzodelivery-default-rtdb.firebaseio.com"
};

// ✅ Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized for LBizzo Vape Shop");
}

const db = firebase.firestore();
const storage = firebase.storage();
window.db = db;
window.storage = storage;
