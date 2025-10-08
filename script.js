// script.js
document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo Vape Shop booting...");

  // ---------- HELPERS ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- AGE VERIFICATION ----------
  const ageCheck = $("#age-check");
  const yesBtn   = $("#yesBtn");
  const noBtn    = $("#noBtn");

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

  // ---------- PRODUCT DATA ----------
  const products = [
    { id: 1, name: "Disposable Vape", price: 19.99, img: "products/vape1.jpg" },
    { id: 2, name: "Juice 60ml", price: 14.99, img: "products/juice1.jpg" },
    { id: 3, name: "Coil Pack", price: 9.99, img: "products/coil.jpg" },
  ];

  const productList  = $("#product-list");
  const cartBtn      = $("#cartBtn");
  const cartPopup    = $("#cart-popup");
  const cartItemsEl  = $("#cart-items");
  const cartTotalEl  = $("#cart-total");
  const checkoutBtn  = $("#checkoutBtn");
  const closeCart    = $("#closeCart");

  // ---------- CART ----------
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));

  function updateCart() {
    cartItemsEl.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      cartItemsEl.innerHTML = "<li>Your cart is empty.</li>";
      cartTotalEl.textContent = "Total: $0";
      return;
    }

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

    // Remove item event
    $$(".remove-item").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const i = Number(e.target.dataset.index);
        cart.splice(i, 1);
        saveCart();
        updateCart();
      });
    });
  }

  // ---------- FIREBASE IMAGE LOADER ----------
  async function getFirebaseImage(path) {
    try {
      if (!window._storage) return null;
      const url = await window._storage.ref(path).getDownloadURL();
      return url;
    } catch {
      console.warn("⚠️ Image not found:", path);
      return null;
    }
  }

  // ---------- RENDER PRODUCTS ----------
  async function renderProducts() {
    productList.innerHTML = "";

    for (const p of products) {
      let imgTag = "";
      const url = window._storage ? await getFirebaseImage(p.img) : null;
      if (url) {
        imgTag = `<img src="${url}" alt="${p.name}" class="product-img" 
          style="width:100%;max-width:180px;border-radius:12px;box-shadow:0 0 10px rgba(255,140,0,0.6);margin-bottom:8px;">`;
      }

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        ${imgTag}
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
      `;
      productList.appendChild(card);
    }

    // Add to cart button
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
  }

  // ---------- CART TOGGLE ----------
  cartBtn.addEventListener("click", () => {
    cartPopup.classList.toggle("hidden");
    updateCart();
  });

  closeCart.addEventListener("click", () => {
    cartPopup.classList.add("hidden");
  });

  // ---------- SCANDIT CONFIG ----------
  const SCANDIT_LICENSE_KEY = "SCANDIT AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRdDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDRq/3pbdNQ2wHBxXMlLL1ubSkte/FG9MLxf7J9KQC5/jlqBwhtXC8O8amwpv0g1/Txo/v8tVBMqkxkYTEZ7AeUvXC9mb0GYDlt+RdXhQedpeU+YQxcj1zzQa+pYTlx1d5laJHh3WMjL1nKzEUZlZXZpUZbxASRzM48blxXef8EtyyVCnS5X2WyBWRUGEGVfjUIiawJRFrxu31ll5ghjcpeWHsJTdTrYUGgegsdXcz6jeB0jcg6cISpkQ+vfVYZ1Cz33hCdJIpjP6YdV1txoUHPQf/9KJkImFT6XFWj6khyUHtnZjDZyyApE4bWHuMZtDzghqN30nYaX47bZQbrSELMCguYjhVRrUaA4M1IBTHMjtwTlFNFSTups1/pUFPI4mNV8ZuKuRwANY9MO4STHjdCfX6CA/xjsbBbBc+b5N1N8E70TNlAUsov2sgisR7ICqNFXG+H93QFuKd3F6nVvY8DiYOZ+7HvY5KVBkIY2Fys70JRdPyRQeCpRdEmwzReb//77uF344Wt0UZmFXSNBAOEPJdDjRvAllzC7ZRtiGYiSbGlV9yDs6Ly6XF0miq2G3pZtiTCQqdYT2/R7M0ENi4qLYDnLbfFAiux3PI/AmUsOfbWRxnKARt2pWn0vFHIdgeswEMITqF2etKjPbjzy5LDs+YxXfF+D4h//svwIUeMuOAjunsNRs2ZUpzdMGAXzUTF/YEE/upE1tRmFrDAWDKzYpb9ouoKNNPDR9SgrwhcCKk+nXbpOhiWlkZjVmBr0edch/b/2ywfMtImPqq/CWix1RSlYHse85OSKKiXaGRp6FqhBccGh7h2FVOWvgVC75c7vJ+sOvksOxhLI8IR46aAnNDHatQwBjrHeIBBbNBNUKj2u34KXvvSvC6qM7FVWKUt1b5zu2rGc4NI=";
  const SCANDIT_ENGINE = "https://cdn.jsdelivr.net/npm/scandit-sdk@5.15.0/build/";
  let pickerReady = false;

  async function ensureScanditReady() {
    if (pickerReady) return;
    await ScanditSDK.configure(SCANDIT_LICENSE_KEY, { engineLocation: SCANDIT_ENGINE });
    pickerReady = true;
  }

  async function startScanner() {
    await ensureScanditReady();
    const modal = document.createElement("div");
    modal.id = "scanner-modal";
    modal.style = `
      position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.9);z-index:9999;color:#fff;flex-direction:column;
    `;
    modal.innerHTML = `
      <div id="scandit-container" style="width:90%;max-width:480px;height:60vh;"></div>
      <button id="cancelScan" style="margin-top:10px;padding:10px 20px;border:0;border-radius:6px;background:#ff8c00;color:#000;font-weight:700;">Cancel</button>
    `;
    document.body.appendChild(modal);

    const picker = await ScanditSDK.BarcodePicker.create($("#scandit-container"), {
      playSoundOnScan: true,
      vibrateOnScan: true,
    });

    const settings = new ScanditSDK.ScanSettings();
    settings.setSymbologyEnabled(ScanditSDK.Barcode.Symbology.PDF417, true);
    await picker.applyScanSettings(settings);

    picker.on("scan", (result) => {
      const raw = result?.barcodes?.[0]?.data || "";
      const dob = extractDOB(raw);
      if (!dob) return alert("Could not read date of birth. Try again.");
      if (!is21Plus(dob)) {
        alert("You must be 21+ to checkout.");
        picker.pauseScanning();
        modal.remove();
        return;
      }
      localStorage.setItem("idVerified", Date.now());
      picker.pauseScanning();
      modal.remove();
      proceedCheckout();
    });

    $("#cancelScan").addEventListener("click", () => {
      picker.pauseScanning();
      modal.remove();
    });
  }

  function extractDOB(text) {
    const m = text.match(/DBB(\d{8})/);
    if (!m) return null;
    const v = m[1];
    let yyyy, mm, dd;
    const firstTwo = parseInt(v.slice(0, 2), 10);
    if (firstTwo > 12) { yyyy = +v.slice(0, 4); mm = +v.slice(4, 6) - 1; dd = +v.slice(6, 8); }
    else { mm = +v.slice(0, 2) - 1; dd = +v.slice(2, 4); yyyy = +v.slice(4, 8); }
    const d = new Date(yyyy, mm, dd);
    return isNaN(d.getTime()) ? null : d;
  }

  const is21Plus = (dob) => new Date() >= new Date(dob.getFullYear() + 21, dob.getMonth(), dob.getDate());

  // ---------- CHECKOUT ----------
  checkoutBtn.addEventListener("click", async () => {
    if (cart.length === 0) return alert("Your cart is empty!");
    const verified = localStorage.getItem("idVerified");
    if (!verified) {
      alert("Please scan your ID to verify you are 21+.");
      try { await startScanner(); } catch { alert("Scanner failed to start. Check camera permissions."); }
      return;
    }
    proceedCheckout();
  });

  function proceedCheckout() {
    const link = "https://square.link/u/GOvQxhqG";
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);
    alert(`Redirecting to checkout... Total: $${total}`);
    window.location.href = link;
  }

  // ---------- INIT ----------
  await renderProducts();
  updateCart();
});
