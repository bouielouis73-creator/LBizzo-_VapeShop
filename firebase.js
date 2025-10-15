// -------------------- LBizzo Vape Shop Firebase Config --------------------
// Make sure this file is included BEFORE script.js in index.html:
// <script defer src="firebase.js"></script>
// <script defer src="script.js"></script>

// ✅ Firebase configuration for lbizzodelivery project
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.appspot.com", // ✅ Correct bucket domain
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
  databaseURL: "https://lbizzodelivery-default-rtdb.firebaseio.com"
};

// ✅ Initialize Firebase (safe check)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized for LBizzo Vape Shop");
} else {
  console.log("⚠️ Firebase already initialized — skipping duplicate init");
}

// ✅ Initialize Firestore and Storage
const db = firebase.firestore();
const storage = firebase.storage();

// ✅ Confirm Firestore connection and check collection
const COLLECTION_NAME = "products"; // change here if your new collection has a different name

db.collection(COLLECTION_NAME)
  .limit(1)
  .get()
  .then((snapshot) => {
    if (!snapshot.empty) {
      console.log(`🔥 Firestore connected — '${COLLECTION_NAME}' collection found.`);
    } else {
      console.warn(`⚠️ Firestore connected, but '${COLLECTION_NAME}' collection is empty.`);
    }
  })
  .catch((error) => {
    console.error("❌ Firestore connection error:", error);
  });

// ✅ Export references (optional global access)
window.db = db;
window.storage = storage;
window.COLLECTION_NAME = COLLECTION_NAME;
