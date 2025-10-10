// script.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ LBizzo booting…");

  // Helpers
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // Elements
  const ageCheck = $("#age-check");
  const yesBtn = $("#yesBtn");
  const noBtn = $("#noBtn");
  const productList = $("#product-list");
  const cartBtn = $("#cartBtn");
  const cartPopup = $("#cart-popup");
  const cartItems = $("#cart-items");
  const cartTotal = $("#cart-total");
  const keepShopping = $("#keepShopping");
  const clearCart = $("#clearCart");
  const checkoutBtn = $("#checkoutBtn");
  const nameInput = $("#cust-name");
  const addressInput = $("#cust-address");
  const phoneInput = $("#cust-phone");

  // Guard: ensure required nodes exist
  const required = [ageCheck, yesBtn, noBtn, productList, cartBtn, cartPopup, cartItems, cartTotal, keepShopping, clearCart, checkoutBtn];
  if (required.some(n => !n)) {
    console.error("❌ Missing required DOM node. Check IDs in index.html.");
    return;
  }

  // Age gate
  yesBtn.addEventListener("click", () => {
    localStorage.setItem("ageVerified", "true");
    ageCheck.style.display = "none";
  });
  noBtn.addEventListener("click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    location.href = "https://google.com";
  });
  if (localStorage.getItem("ageVerified") === "true") ageCheck.style.display = "none";

  document.addEventListener("DOMContentLoaded", async () => {
  console.log("🧱 Adding 50 product placeholders...");

  const productList = document.getElementById("product-list");
  if (!productList) return;

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

    console.log("✅ 50 placeholders added safely.");
  } catch (err) {
    console.error("❌ Error loading placeholders:", err);
  }
});

  // Cart
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));

  // Render products
  function renderProducts() {
    productList.innerHTML = "";
    for (const p of products) {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
      `;
      productList.appendChild(card);
    }

    // add-to-cart (bind once after render)
    $$(".add-to-cart").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = +e.currentTarget.dataset.id;
        const item = products.find(p => p.id === id);
        const existing = cart.find(i => i.id === id);
        if (existing) existing.qty++;
        else cart.push({ ...item, qty: 1 });
        saveCart();
        updateCart();
        cartPopup.classList.remove("hidden");
      });
    });
  }

  // Update cart (uses event delegation for remove buttons)
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

  // Remove via delegation
  cartItems.addEventListener("click", e => {
    const btn = e.target.closest(".remove-item");
    if (!btn) return;
    const i = +btn.dataset.i;
    if (Number.isInteger(i) && i >= 0 && i < cart.length) {
      cart.splice(i, 1);
      saveCart();
      updateCart();
    }
  });

  // Cart toggle
  cartBtn.addEventListener("click", () => {
    cartPopup.classList.toggle("hidden");
    updateCart();
  });
  keepShopping.addEventListener("click", () => cartPopup.classList.add("hidden"));
  clearCart.addEventListener("click", () => { cart = []; saveCart(); updateCart(); });

  // Customer info save/restore
  const savedCustomer = JSON.parse(localStorage.getItem("customerInfo") || "{}");
  nameInput.value = savedCustomer.name || "";
  addressInput.value = savedCustomer.address || "";
  phoneInput.value = savedCustomer.phone || "";
  [nameInput, addressInput, phoneInput].forEach(inp => {
    inp.addEventListener("input", () => {
      localStorage.setItem("customerInfo", JSON.stringify({
        name: nameInput.value, address: addressInput.value, phone: phoneInput.value
      }));
    });
  });

  // Scandit scan → verify 21+ → checkout
  const SCANDIT_LICENSE_KEY =
    "SCANDIT AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRdDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDRq/3pbdNQ2wHBxXMlLL1ubSkte/FG9MLxf7J9KQC5/jlqBwhtXC8O8amwpv0g1/Txo/v8tVBMqkxkYTEZ7AeUvXC9mb0GYDlt+RdXhQedpeU+YQxcj1zzQa+pYTlx1d5laJHh3WMjL1nKzEUZlZXZpUZbxASRzM48blxXef8EtyyVCnS5X2WyBWRUGEGVfjUIiawJRFrxu31ll5ghjcpeWHsJTdTrYUGgegsdXcz6jeB0jcg6cISpkQ+vfVYZ1Cz33hCdJIpjP6YdV1txoUHPQf/9KJkImFT6XFWj6khyUHtnZjDZyyApE4bWHuMZtDzghqN30nYaX47bZQbrSELMCguYjhVRrUaA4M1IBTHMjtwTlFNFSTups1/pUFPI4mNV8ZuKuRwANY9MO4STHjdCfX6CA/xjsbBbBc+b5N1N8E70TNlAUsov2sgisR7ICqNFXG+H93QFuKd3F6nVvY8DiYOZ+7HvY5KVBkIY2Fys70JRdPyRQeCpRdEmwzReb//77uF344Wt0UZmFXSNBAOEPJdDjRvAllzC7ZRtiGYiSbGlV9yDs6Ly6XF0miq2G3pZtiTCQqdYT2/R7M0ENi4qLYDnLbfFAiux3PI/AmUsOfbWRxnKARt2pWn0vFHIdgeswEMITqF2etKjPbjzy5LDs+YxXfF+D4h//svwIUeMuOAjunsNRs2ZUpzdMGAXzUTF/YEE/upE1tRmFrDAWDKzYpb9ouoKNNPDR9SgrwhcCKk+nXbpOhiWlkZjVmBr0edch/b/2ywfMtImPqq/CWix1RSlYHse85OSKKiXaGRp6FqhBccGh7h2FVOWvgVC75c7vJ+sOvksOxhLI8IR46aAnNDHatQwBjrHeIBBbNBNUKj2u34KXvvSvC6qM7FVWKUt1b5zu2rGc4NI=";
  const ENGINE = "https://cdn.jsdelivr.net/npm/scandit-sdk@5.15.0/build/";

  async function startScanner() {
    await ScanditSDK.configure(SCANDIT_LICENSE_KEY, { engineLocation: ENGINE });

    // Simple modal for scanner
    const modal = document.createElement("div");
    modal.style = "position:fixed;inset:0;background:rgba(0,0,0,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10001;";
    modal.innerHTML = `
      <div id="scanner-container" style="width:92%;max-width:480px;height:60vh;"></div>
      <button id="cancelScan" style="margin-top:10px;">Cancel</button>`;
    document.body.appendChild(modal);

    const picker = await ScanditSDK.BarcodePicker.create($("#scanner-container"), { playSoundOnScan:true, vibrateOnScan:true });
    const settings = new ScanditSDK.ScanSettings();
    settings.setSymbologyEnabled(ScanditSDK.Barcode.Symbology.PDF417, true);
    await picker.applyScanSettings(settings);

    picker.on("scan", res => {
      const raw = res?.barcodes?.[0]?.data || "";
      const m = raw.match(/DBB(\d{8})/); // AAMVA: DBB = DOB
      if (!m) return alert("Could not read DOB. Try again.");
      const v = m[1]; // mmddyyyy or yyyymmdd variants exist; most AAMVA uses mmddyyyy
      const month = +v.slice(0,2) - 1, day = +v.slice(2,4), year = +v.slice(4,8);
      const dob = new Date(year, month, day);
      const age21 = new Date(dob.getFullYear()+21, dob.getMonth(), dob.getDate());
      if (new Date() < age21) { alert("You must be 21+ to checkout."); return; }

      localStorage.setItem("idVerified", String(Date.now()));
      picker.pauseScanning();
      picker.destroy();
      modal.remove();
      proceedCheckout();
    });

    $("#cancelScan").onclick = () => { picker.pauseScanning(); picker.destroy(); modal.remove(); };
  }

  // Checkout
  const SQUARE_LINK = "https://square.link/u/QjyYzLGK";
  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!localStorage.getItem("idVerified")) return startScanner();
    proceedCheckout();
  });

  function proceedCheckout() {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
    alert(`Redirecting to checkout… Total: $${total}`);
    location.href = SQUARE_LINK;
  }

  // Init
  renderProducts();
  updateCart();
  console.log("✅ LBizzo ready.");
});
// --------------------------------------------------
// 🔽 Add this at the very bottom of script.js
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🧱 Adding 50 product placeholders...");

  const productList = document.getElementById("product-list");
  if (!productList) return;

  try {
    const snapshot = await db.collection("products").get();
    const products = [];
    snapshot.forEach(doc => products.push(doc.data()));

    // Always show 50 cards total
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

    console.log("✅ 50 placeholders added safely.");
  } catch (err) {
    console.error("❌ Error loading placeholders:", err);
  }
});
