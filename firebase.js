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
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Loading products...");

  const productList = document.getElementById("product-list");
  if (!productList) {
    console.error("❌ #product-list not found in HTML");
    return;
  }

  try {
    const productsRef = db.collection("products");
    const snapshot = await productsRef.get();
    const products = [];
    snapshot.forEach(doc => products.push(doc.data()));

    // Create 50 cards (real + placeholders)
    for (let i = 0; i < 50; i++) {
      const card = document.createElement("div");
      card.className = "product-card";

      if (products[i]) {
        const p = products[i];
        card.innerHTML = `
          <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p>$${p.price}</p>
          <button class="add-to-cart" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>
        `;
      } else {
        card.innerHTML = `
          <img src="https://via.placeholder.com/150?text=Coming+Soon" alt="Placeholder ${i+1}">
          <h3>Coming Soon</h3>
          <p>New item loading...</p>
          <button disabled>Add to Cart</button>
        `;
      }

      productList.appendChild(card);
    }

    console.log("✅ 50 placeholders rendered");
  } catch (err) {
    console.error("❌ Error loading products:", err);
  }
});
