// script.js
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ LBizzo booting…");

  // ---------- ELEMENTS ----------
  const ageCheck = document.getElementById("age-check");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");
  const productList = document.getElementById("product-list");
  const cartBtn = document.getElementById("cartBtn");
  const cartPopup = document.getElementById("cart-popup");
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const keepShopping = document.getElementById("keepShopping");
  const clearCart = document.getElementById("clearCart");
  const checkoutBtn = document.getElementById("checkoutBtn");

  // ---------- AGE GATE ----------
  yesBtn.onclick = () => {
    localStorage.setItem("ageVerified", "true");
    ageCheck.style.display = "none";
  };
  noBtn.onclick = () => {
    alert("Sorry, you must be 21 or older to enter.");
    location.href = "https://google.com";
  };
  if (localStorage.getItem("ageVerified") === "true") ageCheck.style.display = "none";

  // ---------- CART ----------
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));

  function updateCart() {
    cartItems.innerHTML = "";
    if (cart.length === 0) {
      cartTotal.textContent = "Total: $0";
      cartItems.innerHTML = "<li>Your cart is empty.</li>";
      return;
    }
    let total = 0;
    cart.forEach((item, i) => {
      total += item.price * item.qty;
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${item.name} - $${item.price.toFixed(2)} × ${item.qty}</span>
        <button class="remove-item" data-i="${i}">❌</button>
      `;
      cartItems.appendChild(li);
    });
    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
  }

  cartItems.addEventListener("click", e => {
    if (e.target.classList.contains("remove-item")) {
      const i = e.target.dataset.i;
      cart.splice(i, 1);
      saveCart();
      updateCart();
    }
  });

  cartBtn.onclick = () => cartPopup.classList.toggle("hidden");
  keepShopping.onclick = () => cartPopup.classList.add("hidden");
  clearCart.onclick = () => { cart = []; saveCart(); updateCart(); };
  checkoutBtn.onclick = () => alert("Checkout coming soon!");
  updateCart();

  // ---------- LOAD 30 PRODUCTS FROM FIREBASE STORAGE ----------
  console.log("🧱 Loading products from Firebase Storage...");
  try {
    const storageRef = _storage.ref("products"); // Folder: /products
    const list = await storageRef.listAll();
    const files = list.items.slice(0, 30); // Limit to 30 pictures max

    for (let i = 0; i < 30; i++) {
      const card = document.createElement("div");
      card.className = "product-card";

      if (files[i]) {
        // ✅ Load each real image from Firebase Storage
        const file = files[i];
        const url = await file.getDownloadURL();
        const name = file.name.replace(/\.[^/.]+$/, ""); // remove .jpg/.png
        const price = (Math.random() * 20 + 10).toFixed(2); // temporary random price

        card.innerHTML = `
          <img src="${url}" alt="${name}">
          <h3>${name}</h3>
          <p>$${price}</p>
          <button class="add-to-cart" data-name="${name}" data-price="${price}">Add to Cart</button>
        `;
      } else {
        // 🔹 Show placeholder if fewer than 30
        card.innerHTML = `
          <img src="https://via.placeholder.com/150?text=Coming+Soon" alt="Placeholder ${i + 1}">
          <h3>Coming Soon</h3>
          <p>New item loading...</p>
          <button disabled>Add to Cart</button>
        `;
      }

      productList.appendChild(card);
    }

    console.log(`✅ Displayed ${files.length} real images + ${30 - files.length} placeholders.`);
  } catch (err) {
    console.error("❌ Error loading from Firebase Storage:", err);
  }

  // ---------- ADD TO CART ----------
  productList.addEventListener("click", e => {
    if (e.target.classList.contains("add-to-cart")) {
      const name = e.target.dataset.name;
      const price = parseFloat(e.target.dataset.price);
      const existing = cart.find(i => i.name === name);
      if (existing) existing.qty++;
      else cart.push({ name, price, qty: 1 });
      saveCart();
      updateCart();
      cartPopup.classList.remove("hidden");
    }
  });
});
