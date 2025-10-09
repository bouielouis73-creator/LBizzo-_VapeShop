// firebase.js
// --------------------------------------------------
// Initialize Firebase for LBizzo Vape Shop
// --------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.appspot.com",
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore & Storage
window.db = firebase.firestore();
window._storage = firebase.storage();

// Log confirmation
console.log("🔥 Firebase connected successfully");

// --------------------------------------------------
// 🔼 Optional Upload Function (for admin use later)
// --------------------------------------------------
window.uploadProductImage = async function (file, productId) {
  try {
    const ref = _storage.ref(`products/${productId}-${file.name}`);
    const snap = await ref.put(file);
    const url = await snap.ref.getDownloadURL();
    console.log(`✅ Uploaded ${file.name}: ${url}`);
    return url;
  } catch (err) {
    console.error("❌ Upload failed:", err);
    alert("Upload failed — check Firebase Storage rules.");
    return null;
  }
};
