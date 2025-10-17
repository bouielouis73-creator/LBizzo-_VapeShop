// Firebase config (confirmed)
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.firebasestorage.app",
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
  databaseURL: "https://lbizzodelivery-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
window.storage = firebase.storage();
