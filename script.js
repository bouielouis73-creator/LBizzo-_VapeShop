// script.js
document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo Vape Shop booting...");

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

  // ---------- SCANDIT CONFIG ----------
  const SCANDIT_LICENSE_KEY = "YOUR_SCANDIT_LICENSE_KEY"; // replace with your real key
  const SCANDIT_ENGINE = "https://cdn.jsdelivr.net/npm/scandit-sdk@5.15.0/build/";

  let picker = null;
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

    picker = await ScanditSDK.BarcodePicker.create($("#scandit-container"), {
      playSoundOnScan: true,
      vibrateOnScan: true,
    });

    const settings = new ScanditSDK.ScanSettings();
    settings.setSymbologyEnabled(ScanditSDK.Barcode.Symbology.PDF417, true);
    await picker.applyScanSettings(settings);

    picker.on("scan", (result) => {
      const raw = result?.barcodes?.[0]?.data || "";
      const dob = extractDOB(raw);
      if (!dob) {
        alert("Could not read date of birth. Try again.");
        return;
      }
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
    if (firstTwo > 12) {
      yyyy = parseInt(v.slice(0, 4), 10);
      mm = parseInt(v.slice(4, 6), 10) - 1;
      dd = parseInt(v.slice(6, 8), 10);
    } else {
      mm = parseInt(v.slice(0, 2), 10) - 1;
      dd = parseInt(v.slice(2, 4), 10);
      yyyy = parseInt(v.slice(4, 8), 10);
    }
    const d = new Date(yyyy, mm, dd);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function is21Plus(dob) {
    const now = new Date();
    const age = new Date(dob.getFullYear() + 21, dob.getMonth(), dob.getDate());
    return now >= age;
  }

  // ---------- CHECKOUT ----------
  checkoutBtn.addEventListener("click", async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const verified = localStorage.getItem("idVerified");
    if (!verified) {
      alert("Please scan your ID to verify you are 21+.");
      try {
        await startScanner();
      } catch (err) {
        alert("Scanner failed to start. Check camera permissions.");
      }
      return;
    }

    proceedCheckout();
  });

  function proceedCheckout() {
    const checkoutLink = "https://square.link/u/GOvQxhqG"; // your Square checkout link
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);
    alert(`Redirecting to checkout... Total: $${total}`);
    window.location.href = checkoutLink;
  }

  // ---------- INIT ----------
  updateCart();
});
