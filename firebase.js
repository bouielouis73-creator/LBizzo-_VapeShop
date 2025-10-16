// -------------------- LBizzo Vape Shop Firebase Config --------------------
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.appspot.com", // correct bucket
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
    databaseURL: "https://lbizzodelivery-default-rtdb.firebaseio.com"
  };

  if (!window.firebase) {
    console.error("Firebase SDK not loaded.");
    return;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized:", firebase.app().name);
  } else {
    console.log("⚠️ Firebase already initialized.");
  }

  // Expose for app
  window.db = firebase.firestore();
  window.storage = firebase.storage();
})();
