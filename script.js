document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ LBizzo booting…");

  // ELEMENTS
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

  // AGE CHECK
  yesBtn.onclick = () => {
    localStorage.setItem("ageVerified", "true");
    ageCheck.style.display = "none";
  };
  noBtn.onclick = () => {
    alert("Sorry, you must be 21 or older to enter.");
    location.href = "https://google.com";
  };
  if (localStorage.getItem("ageVerified") === "true") ageCheck.style.display = "none";

  // CART
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
});

// ✅ NEW FIREBASE PRODUCT LOADER (Up to 50 w/ your pictures)
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🧱 Loading products from Firestore...");

  const productList = document.getElementById("product-list");
  if (!productList) return console.error("❌ No #product-list found");

  try {
    const snapshot = await db.collection("products").get();
    const products = [];
    snapshot.forEach(doc => products.push(doc.data()));

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

    console.log("✅ 50 products loaded (real + placeholders).");
  } catch (err) {
    console.error("❌ Error loading products:", err);
  }
});
