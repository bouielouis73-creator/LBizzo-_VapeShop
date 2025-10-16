/* Firebase initialization (compat v9) */
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.appspot.com",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized");
  } else {
    console.log("ℹ️ Firebase already initialized");
  }

  // Expose for debugging if needed
  window._db = firebase.firestore();
  window._storage = firebase.storage();

  // EmailJS keys (your real ones)
  window.EMAILJS_PUBLIC_KEY = "jUx6gEqKl1tvL7yLs";
  window.EMAILJS_SERVICE_ID = "service_7o2u4kq";
  window.EMAILJS_TEMPLATE_ID = "template_6jlkofi";

  // Optional: set your Scandit key globally; otherwise meta tag will be used
  // window.SCANDIT_LICENSE_KEY = "PASTE_YOUR_SCANDIT_KEY_HERE";
})();
