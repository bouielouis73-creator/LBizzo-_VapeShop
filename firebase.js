<script>
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.appspot.com",
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
  databaseURL: "https://lbizzodelivery-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
window.storage = firebase.storage();

/**
 * ✅ Get download URL for image from Storage /products/ folder
 * Firestore docs should have image field like "products/filename.jpg"
 */
window.getStorageURL = async function(path) {
  if (!path) return null;
  try {
    // Always point to lowercase /products/
    if (!path.startsWith("products/")) path = "products/" + path;
    return await storage.ref(path).getDownloadURL();
  } catch (e) {
    console.warn("Storage URL error for", path, e);
    return null;
  }
};
</script>
