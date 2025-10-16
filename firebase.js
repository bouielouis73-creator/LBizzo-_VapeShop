(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.appspot.com",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
  };

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized");

  window._db = firebase.firestore();
  window._storage = firebase.storage();

  // ✅ EmailJS
  window.EMAILJS_PUBLIC_KEY  = "jUx6gEqKl1tvL7yLs";
  window.EMAILJS_SERVICE_ID  = "service_7o2u4kq";
  window.EMAILJS_TEMPLATE_ID = "template_6jlkofi";

  // ✅ Scandit License Key (your real one)
  window.SCANDIT_LICENSE_KEY =
  "AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRdDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDRq/3pbdNQ2wHBxXMlLL1ubSkte/FG9MLxf7J9KQC5/jlqBwhtXC8O8amwpv0g1/Txo/v8tVBMqkxkYTEZ7AeUvXC9mb0GYDlt+RdXhQedpeU+YQxcj1zzQa+pYTlx1d5laJHh3WMjL1nKzEUZlZXZpUZbxASRzM48blxXef8EtyyVCnS5X2WyBWRUGEGVfjUIiawJRFrxu31ll5ghjcpeWHsJTdTrYUGgegsdXcz6jeB0jcg6cISpkQ+vfVYZ1Cz33hCdJIpjP6YdV1txoUHPQf/9KJkImFT6XFWj6khyUHtnZjDZyyApE4bWHuMZtDzghqN30nYaX47bZQbrSELMCguYjhVRrUaA4M1IBTHMjtwTlFNFSTups1/pUFPI4mNV8ZuKuRwANY9MO4STHjdCfX6CA/xjsbBbBc+b5N1N8E70TNlAUsov2sgisR7ICqNFXG+H93QFuKd3F6nVvY8DiYOZ+7HvY5KVBkIY2Fys70JRdPyRQeCpRdEmwzReb//77uF344Wt0UZmFXSNBAOEPJdDjRvAllzC7ZRtiGYiSbGlV9yDs6Ly6XF0miq2G3pZtiTCQqdYT2/R7M0ENi4qLYDnLbfFAiux3PI/AmUsOfbWRxnKARt2pWn0vFHIdgeswEMITqF2etKjPbjzy5LDs+YxXfF+D4h//svwIUeMuOAjunsNRs2ZUpzdMGAXzUTF/YEE/upE1tRmFrDAWDKzYpb9ouoKNNPDR9SgrwhcCKk+nXbpOhiWlkZjVmBr0edch/b/2ywfMtImPqq/CWix1RSlYHse85OSKKiXaGRp6FqhBccGh7h2FVOWvgVC75c7vJ+sOvksOxhLI8IR46aAnNDHatQwBjrHeIBBbNBNUKj2u34KXvvSvC6qM7FVWKUt1b5zu2rGc4NI=";
})();
