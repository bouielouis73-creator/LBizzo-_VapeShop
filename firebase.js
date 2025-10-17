// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.appspot.com",
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
};
firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
window.storage = firebase.storage();

window.getStorageURL = async function (path) {
  try {
    if (!path.startsWith("products/")) path = "products/" + path;
    return await storage.ref(path).getDownloadURL();
  } catch (e) {
    console.warn("Image error:", path, e);
    return "https://via.placeholder.com/150?text=No+Image";
  }
};
