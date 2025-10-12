// Firebase config (yours)
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.firebasestorage.app",
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
};

// Init
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Helper: get Storage URL for product images
async function getImageURL(path) {
  try {
    return await storage.ref(path).getDownloadURL();
  } catch (err) {
    console.warn("Image not found for:", path);
    return null;
  }
}
