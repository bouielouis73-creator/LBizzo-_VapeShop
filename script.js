// ============================================================
// ✅ LBizzo Vape Shop — Base Working Version
// Firebase Firestore + Storage
// Cart, Checkout, and Age Gate — stable base
// ============================================================

(() => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo base script booting…");

  // ---------- Firebase ----------
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.appspot.com",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ---------- Helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>
        <rect width='100%' height='100%' fill='#111'/>
        <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#ff8c00'
        font-family='Arial' font-size='16'>No Image</text></svg>`
    );

  // ---------- Age Gate ----------
  const overlay = $("#age-check");
  const yes = $("#yesBtn");
  const no = $("#noBtn");

  overlay.style.display = "grid";
  yes.addEventListener("click", () => (overlay.style.display = "none"));
  no.addEventListener("click", () => {
    alert("Sorry, you must be 21+ to enter.");
    window.location.href = "https://google.com";
  });

  // ---------- Product Loading ----------
  async function getImageURL(fileName) {
    try {
      const path = fileName.startsWith("products/")
        ? fileName
        : `products/${fileName}`;
      return await storage.ref().child(path).getDownloadURL();
    } catch (e) {
      console.warn("Image missing:", fileName);
      return PLACEHOLDER_IMG;
    }
  }

  async function loadProducts() {
    const list = $("#product-list");
    list.innerHTML = "<p>Loading products...</p>";

    try {
      const snap = await db.collection("products").limit(50).get();
      if (snap.empty) {
        list.innerHTML = "<p>No products found in Firestore.</p>";
        return;
      }

      list.innerHTML = "";
      for (const doc of snap.docs) {
        const data = doc.data();
        const price = Number(data.price) || 0;
        const img = await getImageURL(data.image);

        const card = document.createElement("div");
        card.className = "product";
        card.innerHTML = `
          <img src="${img}" alt="${data.name}" />
          <div class="pad">
            <h3>${data.name}</h3>
            <p>$${price.toFixed(2)}</p>
            <button class="add-btn">Add to Cart</button>
          </div>
        `;
        card.querySelector(".add-btn").addEventListener("click", () =>
          addToCart(data.name, price)
        );
        list.appendChild(card);
      }
    } catch (e) {
      list.innerHTML = "<p style='color:red'>Failed to load products.</p>";
      console.error(e);
    }
  }

  // ---------- Cart ----------
  let cart = [];
  const cartEl = $("#cart");
  const itemsEl = $("#cart-items");
  const totalEl = $("#cart-total");
  const countEl = $("#cart-count");
  const cartBtn = $("#cart-btn");
  const checkoutBtn = $("#checkout-btn");

  cartBtn.addEventListener("click", () => (cartEl.hidden = !cartEl.hidden));

  function renderCart() {
    itemsEl.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
      const li = document.createElement("li");
      li.innerHTML = `${item.name} - $${item.price.toFixed(2)} × ${item.qty}
        <button data-i="${i}">−</button>`;
      li.querySelector("button").addEventListener("click", () => {
        item.qty--;
        if (item.qty <= 0) cart.splice(i, 1);
        renderCart();
      });
      itemsEl.appendChild(li);
      total += item.price * item.qty;
    });
    totalEl.textContent = total.toFixed(2);
    countEl.textContent = cart.reduce((s, c) => s + c.qty, 0);
  }

  function addToCart(name, price) {
    const found = cart.find((c) => c.name === name);
    if (found) found.qty++;
    else cart.push({ name, price, qty: 1 });
    renderCart();
  }

  checkoutBtn.addEventListener("click", () => {
    if (!cart.length) return alert("Your cart is empty!");
    alert("🧾 Checkout complete! (test mode)");
    cart = [];
    renderCart();
  });

  // ---------- Start ----------
  window.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();
    renderCart();
  });
})();
