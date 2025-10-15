// -------------------- LBizzo Vape Shop Firebase Config --------------------
// Make sure this file is included in your <head> in index.html BEFORE script.js
// Example:
// <script defer src="firebase.js"></script>
// <script defer src="script.js"></script>

// ✅ Your Firebase configuration (corrected)
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.appspot.com",   // ✅ fixed domain (.appspot.com)
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
  databaseURL: "https://lbizzodelivery-default-rtdb.firebaseio.com"
};

// ✅ Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized for LBizzo Vape Shop");
} else {
  console.log("⚠️ Firebase already initialized, skipping duplicate init");
}

// ✅ Initialize Firestore and Storage references
const db = firebase.firestore();
const storage = firebase.storage();

// ✅ Example: confirm connection (optional)
db.collection("products")
  .limit(1)
  .get()
  .then((snap) => {
    if (!snap.empty) {
      console.log("🔥 Firestore connected — product collection found.");
    } else {
      console.warn("⚠️ Firestore connected, but 'products' collection is empty.");
    }
  })
  .catch((err) => {
    console.error("❌ Firestore connection error:", err);
  });
