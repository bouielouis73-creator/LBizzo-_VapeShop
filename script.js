// script.js
document.addEventListener("DOMContentLoaded", () => {
  if (window.__LBIZZO_BOOTED__) {
    console.warn("LBizzo already initialized — skipping second boot.");
    return;
  }
  window.__LBIZZO_BOOTED__ = true;

  console.log("✅ LBizzo Vape Shop Script Loaded");

  // ---------- HELPERS ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- AGE VERIFICATION ----------
  const ageCheck = $("#age-check");
  const yesBtn = $("#yesBtn");
  const noBtn = $("#noBtn");

  yesBtn?.addEventListener("click", () => {
    localStorage.setItem("ageVerified", "true");
    ageCheck.style.display = "none";
  });

  noBtn?.addEventListener("click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    window.location.href = "https://google.com";
  });

  if (localStorage.getItem("ageVerified") === "true") {
    ageCheck.style.display = "none";
  }

  // ---------- PRODUCTS ----------
  const products = [
    { id: 1, name: "Disposable Vape", price: 19.99 },
    { id: 2, name: "Juice 60ml", price: 14.99 },
    { id: 3, name: "Coil Pack", price: 9.99 },
  ];

  const productList = $("#product-list");
  const cartBtn = $("#cartBtn");
  const cartPopup = $("#cart-popup");
  const cartItemsEl = $("#cart-items");
  const cartTotalEl = $("#cart-total");
  const checkoutBtn = $("#checkoutBtn");
  const closeCart = $("#closeCart");

  // ---------- CART ----------
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));

  const updateCart = () => {
    // Clear current list
    cartItemsEl.innerHTML = "";

    if (cart.length === 0) {
      cartItemsEl.innerHTML = "<li>Your cart is empty.</li>";
      cartTotalEl.textContent = "Total: $0";
      return;
    }

    let total = 0;
    cart.forEach((item, index) => {
      total += item.price * item.qty;
      const li = document.createElement("li");
      li.innerHTML = `
        ${item.name} - $${item.price.toFixed(2)} × ${item.qty}
        <button class="remove-item" data-index="${index}">❌</button>
      `;
      cartItemsEl.appendChild(li);
    });

    cartTotalEl.textContent = `Total: $${total.toFixed(2)}`;

    // Enable remove buttons
    $$(".remove-item").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.target.dataset.index;
        cart.splice(index, 1);
        saveCart();
        updateCart();
      });
    });
  };

  // ---------- RENDER PRODUCTS ----------
  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p>$${p.price.toFixed(2)}</p>
      <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
    `;
    productList.appendChild(card);
  });

  // ---------- ADD TO CART ----------
  $$(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      const product = products.find((p) => p.id === id);
      const existing = cart.find((i) => i.id === id);

      if (existing) existing.qty++;
      else cart.push({ ...product, qty: 1 });

      saveCart();
      updateCart();
      alert(`${product.name} added to cart.`);
    });
  });

  // ---------- CART TOGGLE ----------
  cartBtn.addEventListener("click", () => {
    cartPopup.classList.toggle("hidden");
    updateCart();
  });

  closeCart.addEventListener("click", () => {
    cartPopup.classList.add("hidden");
  });

  // ---------- CHECKOUT ----------
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Replace this link with your actual Square checkout link
    const checkoutLink = "https://square.link/u/GOvQxhqG";
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);

    alert(`Proceeding to checkout. Total: $${total}`);
    window.location.href = checkoutLink;
  });

  // ---------- INITIAL LOAD ----------
  updateCart();
});
