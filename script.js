// script.js
document.addEventListener("DOMContentLoaded", () => {
  if (window.__LBIZZO_BOOTED__) {
    console.warn("LBizzo already initialized — skipping second boot.");
    return;
  }
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo JS booting…");

  const $ = (sel, root = document) => root.querySelector(sel);
  const ensureEl = (id, tag, parent = document.body, html = "") => {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag);
      el.id = id;
      if (html) el.innerHTML = html;
      parent.appendChild(el);
    }
    return el;
  };

  // === AGE VERIFICATION (unchanged) ===
  const ageCheck = document.getElementById("age-check");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");

  if (yesBtn && noBtn && ageCheck) {
    yesBtn.addEventListener("click", () => {
      ageCheck.style.display = "none";
      localStorage.setItem("ageVerified", "true");
    });
    noBtn.addEventListener("click", () => {
      alert("Sorry, you must be 21 or older to enter this site.");
      window.location.href = "https://www.google.com";
    });
    if (localStorage.getItem("ageVerified") === "true") {
      ageCheck.style.display = "none";
    }
  }

  // === Ensure UI elements exist ===
  let header = $("header");
  if (!header) {
    header = document.createElement("header");
    header.innerHTML = `
      <h1>LBizzo Vape Shop</h1>
      <button id="cart-btn">🛒 Cart (<span id="cart-count">0</span>)</button>`;
    document.body.prepend(header);
  }
  ensureEl("product-list", "main", document.body, "");
  let cartSection = $("#cart");
  if (!cartSection) {
    cartSection = document.createElement("section");
    cartSection.id = "cart";
    cartSection.style.display = "none";
    cartSection.innerHTML = `
      <h2>Your Cart</h2>
      <ul id="cart-items"></ul>
      <p id="cart-total"><strong>Total:</strong> $0.00</p>
      <button id="checkout-btn">Checkout</button>`;
    document.body.appendChild(cartSection);
  } else {
    ensureEl("cart-items", "ul", cartSection);
    ensureEl("cart-total", "p", cartSection, "<strong>Total:</strong> $0.00");
    ensureEl("checkout-btn", "button", cartSection, "Checkout");
  }

  // === CART STATE ===
  const cartBtn = document.getElementById("cart-btn");
  const cartItemsList = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");
  const checkoutBtn = document.getElementById("checkout-btn");
  const cartTotalEl = document.getElementById("cart-total");

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("lbizzo_cart") || "[]"); } catch { cart = []; }

  const saveCart = () => localStorage.setItem("lbizzo_cart", JSON.stringify(cart));
  const calcTotal = () => cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);

  function updateCart() {
    cartItemsList.innerHTML = "";
    cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "cart-item";
      const qty = item.qty || 1;
      li.innerHTML = `
        <span>${item.name} - $${item.price.toFixed(2)}</span>
        <div class="cart-controls">
          <button class="dec" data-idx="${index}">−</button>
          <span class="qty">${qty}</span>
          <button class="inc" data-idx="${index}">+</button>
          <button class="remove-btn" data-idx="${index}">Remove</button>
        </div>`;
      cartItemsList.appendChild(li);
    });
    const total = calcTotal();
    cartTotalEl.innerHTML = `<strong>Total:</strong> $${total.toFixed(2)}`;
    cartCount.textContent = cart.reduce((n, i) => n + (i.qty || 1), 0);
    saveCart();
  }

  // === FIXED CART BUTTON (open + scroll to checkout) ===
  cartBtn.addEventListener("click", () => {
    cartSection.style.display = "block";
    // Smooth scroll directly to checkout
    if (checkoutBtn) checkoutBtn.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // === PRODUCTS ===
  const productList = document.getElementById("product-list");
  if (productList.children.length === 0) {
    const products = [
      { id: 1, name: "Disposable Vape", price: 19.99 },
      { id: 2, name: "Vape Juice", price: 14.99 },
      { id: 3, name: "Coil", price: 9.99 },
      { id: 4, name: "Battery", price: 24.99 },
    ];
    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "product";
      card.innerHTML = `
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button class="add-to-cart" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>`;
      productList.appendChild(card);
    });
  }

  // === ADD / REMOVE / +/- ===
  productList.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    const existing = cart.find((i) => i.name === name && i.price === price);
    if (existing) existing.qty = (existing.qty || 1) + 1;
    else cart.push({ name, price, qty: 1 });
    updateCart();
  });

  cartItemsList.addEventListener("click", (e) => {
    const remove = e.target.closest(".remove-btn");
    const inc = e.target.closest(".inc");
    const dec = e.target.closest(".dec");
    if (!remove && !inc && !dec) return;
    const idx = parseInt((remove || inc || dec).dataset.idx, 10);
    if (remove) cart.splice(idx, 1);
    else if (inc) cart[idx].qty++;
    else if (dec) cart[idx].qty = Math.max(1, cart[idx].qty - 1);
    updateCart();
  });

  // === CHECKOUT ===
  checkoutBtn.addEventListener("click", () => {
    const total = calcTotal();
    if (total <= 0) return alert("Your cart is empty!");
    alert(`✅ Thank you! Your total is $${total.toFixed(2)}.`);
    cart = [];
    updateCart();
    cartSection.style.display = "none";
  });

  updateCart();
  console.log("✅ LBizzo initialized.");
});
