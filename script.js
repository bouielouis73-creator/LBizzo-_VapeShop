// script.js
document.addEventListener("DOMContentLoaded", () => {
  // Prevent double-boot if the page accidentally includes script.js twice
  if (window.__LBIZZO_BOOTED__) {
    console.warn("LBizzo already initialized — skipping second boot.");
    return;
  }
  window.__LBIZZO_BOOTED__ = true;

  console.log("✅ LBizzo JS booting…");

  // ---------- HELPERS ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
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

  // ---------- AGE VERIFICATION (UNCHANGED FROM YOUR WORKING CODE) ----------
  const ageCheck = document.getElementById("age-check");
  const yesBtn   = document.getElementById("yesBtn");
  const noBtn    = document.getElementById("noBtn");

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

  // ---------- ENSURE REQUIRED UI EXISTS (SELF-HEALING) ----------
  // Header with Cart button
  let header = $("header");
  if (!header) {
    header = document.createElement("header");
    header.innerHTML = `
      <h1>LBizzo Vape Shop</h1>
      <button id="cart-btn">🛒 Cart (<span id="cart-count">0</span>)</button>
    `;
    document.body.prepend(header);
  } else {
    // Make sure cart button/count exist
    let cartBtn = $("#cart-btn", header);
    if (!cartBtn) {
      const btn = document.createElement("button");
      btn.id = "cart-btn";
      btn.innerHTML = `🛒 Cart (<span id="cart-count">0</span>)`;
      header.appendChild(btn);
    } else if (!$("#cart-count", cartBtn)) {
      cartBtn.innerHTML = `🛒 Cart (<span id="cart-count">0</span>)`;
    }
  }

  // Product list container
  const productList = ensureEl(
    "product-list",
    "main",
    document.body,
    ""
  );
  productList.classList.add("product-grid");

  // Cart section
  let cartSection = $("#cart");
  if (!cartSection) {
    cartSection = document.createElement("section");
    cartSection.id = "cart";
    cartSection.style.display = "none"; // hidden by default
    cartSection.innerHTML = `
      <h2>Your Cart</h2>
      <ul id="cart-items"></ul>
      <p id="cart-total"><strong>Total:</strong> $0.00</p>
      <button id="checkout-btn">Checkout</button>
    `;
    document.body.appendChild(cartSection);
  } else {
    // Make sure inner pieces exist
    ensureEl("cart-items", "ul", cartSection);
    ensureEl("cart-total", "p",  cartSection, `<strong>Total:</strong> $0.00`);
    ensureEl("checkout-btn", "button", cartSection, "Checkout");
  }

  // ---------- CART STATE ----------
  const cartBtn       = document.getElementById("cart-btn");
  const cartItemsList = document.getElementById("cart-items");
  const cartCount     = document.getElementById("cart-count");
  const checkoutBtn   = document.getElementById("checkout-btn");
  const cartTotalEl   = document.getElementById("cart-total");

  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("lbizzo_cart") || "[]");
  } catch {
    cart = [];
  }

  const saveCart = () => localStorage.setItem("lbizzo_cart", JSON.stringify(cart));

  const calcTotal = () =>
    cart.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);

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
        </div>
      `;
      cartItemsList.appendChild(li);
    });

    const total = calcTotal();
    cartTotalEl.innerHTML = `<strong>Total:</strong> $${total.toFixed(2)}`;
    cartCount.textContent = cart.reduce((n, i) => n + (i.qty || 1), 0);
    saveCart();
  }

  // ---------- SHOW / HIDE CART ----------
  cartBtn.addEventListener("click", () => {
    const visible = cartSection.style.display !== "none";
    cartSection.style.display = visible ? "none" : "block";
  });

  // ---------- DEFAULT PRODUCTS (only render if none exist yet) ----------
  if (productList.children.length === 0) {
    const products = [
      { id: 1, name: "Disposable Vape", price: 19.99 },
      { id: 2, name: "Vape Juice",      price: 14.99 },
      { id: 3, name: "Coil",            price:  9.99 },
      { id: 4, name: "Battery",         price: 24.99 },
    ];

    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "product";
      card.innerHTML = `
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button class="add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>
      `;
      productList.appendChild(card);
    });
  }

  // ---------- EVENT DELEGATION: ADD / REMOVE / +/- ----------
  // Add to cart (works for dynamically created buttons too)
  productList.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;
    const name  = btn.dataset.name || btn.getAttribute("data-name") || "Item";
    const price = parseFloat(btn.dataset.price || btn.getAttribute("data-price") || "0") || 0;

    // If same name exists, bump qty
    const existing = cart.find((i) => i.name === name && i.price === price);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({ name, price, qty: 1 });
    }
    updateCart();
  });

  // Remove / increment / decrement in cart (single listener)
  cartItemsList.addEventListener("click", (e) => {
    const remove = e.target.closest(".remove-btn");
    const inc    = e.target.closest(".inc");
    const dec    = e.target.closest(".dec");
    if (!remove && !inc && !dec) return;

    const idx = parseInt((remove || inc || dec).dataset.idx, 10);
    if (Number.isNaN(idx) || !cart[idx]) return;

    if (remove) {
      cart.splice(idx, 1);
    } else if (inc) {
      cart[idx].qty = (cart[idx].qty || 1) + 1;
    } else if (dec) {
      cart[idx].qty = Math.max(1, (cart[idx].qty || 1) - 1);
    }
    updateCart();
  });

  // ---------- CHECKOUT ----------
  checkoutBtn.addEventListener("click", () => {
    const total = calcTotal();
    if (total <= 0) {
      alert("Your cart is empty!");
      return;
    }
    alert(`✅ Thank you! Your total is $${total.toFixed(2)}.`);
    cart = [];
    updateCart();
  });

  // Initial render (restores from localStorage)
  updateCart();

  console.log("✅ LBizzo initialized.");
});
