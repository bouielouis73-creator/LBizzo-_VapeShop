// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.firebasestorage.app",
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// ✅ Helper to get product image URLs
async function getProductImage(path) {
  try {
    return await storage.ref(path).getDownloadURL();
  } catch (e) {
    console.warn("Image not found for:", path);
    return null;
  }
}
