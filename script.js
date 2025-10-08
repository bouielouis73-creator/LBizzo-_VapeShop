// script.js
document.addEventListener("DOMContentLoaded", () => {
  if (window.__LBIZZO_BOOTED__) {
    console.warn("LBizzo already initialized — skipping second boot.");
    return;
  }
  window.__LBIZZO_BOOTED__ = true;

  console.log("✅ LBizzo JS booting…");

  // ---------- CONFIG ----------
  const REQUIRE_ID_SCAN = true; // set to false to bypass Scandit (for quick testing)
  const SCANDIT_LICENSE_KEY = "YOUR_SCANDIT_LICENSE_KEY"; // <-- replace with your Scandit key
  const SCANDIT_ENGINE_URL = "https://cdn.jsdelivr.net/npm/scandit-sdk@5.15.0/build/"; // CDN engine files

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

  // inject minimal modal styles
  const styleTag = ensureEl("lbizzo-scanner-style", "style", document.head);
  styleTag.textContent = `
    #scanner-modal{position:fixed;inset:0;background:rgba(0,0,0,.9);
      display:none;align-items:center;justify-content:center;z-index:9999}
    #scanner-modal.show{display:flex}
    .scanner-card{width:95vw;max-width:540px;background:#111;color:#fff;
      border:2px solid #ff8c00;border-radius:14px;box-shadow:0 0 22px #ff8c00;padding:12px}
    #scandit-container{width:100%;height:60vh;max-height:520px}
    #close-scan{margin-top:10px;width:100%;padding:12px;border-radius:10px;border:0;background:#ff8c00;color:#000;font-weight:700}
  `;

  // ensure modal exists
  const modalHtml = `
    <div class="scanner-card">
      <div id="scandit-container"></div>
      <button id="close-scan">Cancel</button>
    </div>`;
  const scannerModal = ensureEl("scanner-modal", "div", document.body, modalHtml);

  // ---------- AGE VERIFICATION (unchanged) ----------
  const ageCheck = $("#age-check");
  const yesBtn = $("#yesBtn");
  const noBtn = $("#noBtn");

  yesBtn?.addEventListener("click", () => {
    ageCheck.style.display = "none";
    localStorage.setItem("ageVerified", "true");
  });

  noBtn?.addEventListener("click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    location.href = "https://google.com";
  });

  if (localStorage.getItem("ageVerified") === "true") {
    ageCheck && (ageCheck.style.display = "none");
  }

  // ---------- PRODUCTS ----------
  const products = [
    { id: 1, name: "Disposable Vape", price: 19.99 },
    { id: 2, name: "Juice 60ml",    price: 14.99 },
    { id: 3, name: "Coil Pack",     price:  9.99 },
  ];

  const productList = $("#product-list");
  const cartCount = $("#cart-count");
  const cartItemsEl = $("#cart-items");
  const cartSection = $("#cart");

  // ---------- CART ----------
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const saveCart        = () => localStorage.setItem("cart", JSON.stringify(cart));
  const updateCartCount = () => cartCount && (cartCount.textContent =
    cart.reduce((sum, item) => sum + item.qty, 0));

  const renderCart = () => {
    if (!cartItemsEl) return;
    cartItemsEl.innerHTML = "";
    if (cart.length === 0) {
      cartItemsEl.innerHTML = "<li>Your cart is empty</li>";
      return;
    }
    cart.forEach((item, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${item.name} - $${item.price.toFixed(2)} × ${item.qty}
        <button class="remove-btn" data-index="${i}">❌</button>`;
      cartItemsEl.appendChild(li);
    });
    $$(".remove-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const index = Number(e.currentTarget.dataset.index);
        cart.splice(index, 1);
        saveCart(); updateCartCount(); renderCart();
      });
    });
  };

  // ---------- RENDER PRODUCTS ----------
  if (productList) {
    products.forEach(p => {
      const div = document.createElement("div");
      div.className = "product-card";
      div.innerHTML = `
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>`;
      productList.appendChild(div);
    });

    $$(".add-to-cart").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = Number(e.currentTarget.dataset.id);
        const product = products.find(p => p.id === id);
        const existing = cart.find(i => i.id === id);
        if (existing) existing.qty++;
        else cart.push({ ...product, qty: 1 });
        saveCart(); updateCartCount(); renderCart();
      });
    });
  }

  // ---------- CART TOGGLE ----------
  $("#cart-btn")?.addEventListener("click", () => {
    cartSection?.classList.toggle("show");
  });

  // ---------- CHECKOUT BUTTON ----------
  const checkoutBtn = document.createElement("button");
  checkoutBtn.id = "checkout-btn";
  checkoutBtn.textContent = "Proceed to Checkout 🛒";
  cartSection?.appendChild(checkoutBtn);

  checkoutBtn.addEventListener("click", async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    // Gate checkout behind ID scan if enabled and not already verified this session.
    const idv = JSON.parse(localStorage.getItem("idVerified") || "null");
    const verifiedRecently = idv && Date.now() - idv.ts < 24 * 60 * 60 * 1000; // 24h TTL

    if (REQUIRE_ID_SCAN && !verifiedRecently) {
      openScanner();
      try {
        await ensureScanditReady();
        await startScan();
      } catch (err) {
        console.error(err);
        alert("Scanner failed to start. Please check camera permissions.");
      }
      return; // actual redirect happens after successful scan
    }

    proceedToSquareCheckout();
  });

  function proceedToSquareCheckout() {
    const baseCheckoutURL = "https://square.link/u/GOvQxhqG"; // replace with your Square link
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);
    alert(`Redirecting to checkout... Total: $${total}`);
    location.href = baseCheckoutURL;
  }

  // ---------- SCANDIT: INIT + SCAN ----------
  let picker = null;
  let pickerReady = false;

  async function ensureScanditReady() {
    if (!REQUIRE_ID_SCAN) return;
    if (!SCANDIT_LICENSE_KEY || SCANDIT_LICENSE_KEY.startsWith("YOUR_")) {
      throw new Error("Missing Scandit license key.");
    }
    if (pickerReady) return;
    await ScanditSDK.configure(SCANDIT_LICENSE_KEY, { engineLocation: SCANDIT_ENGINE_URL }); // init SDK
    pickerReady = true;
  }

  function openScanner() {
    scannerModal.classList.add("show");
  }
  function closeScanner() {
    scannerModal.classList.remove("show");
  }
  $("#close-scan")?.addEventListener("click", () => {
    picker?.pauseScanning();
    closeScanner();
  });

  async function startScan() {
    const container = $("#scandit-container");
    if (!container) return;

    // (create once, reuse)
    if (!picker) {
      picker = await ScanditSDK.BarcodePicker.create(container, {
        playSoundOnScan: true,
        vibrateOnScan: true,
        scanningPaused: false,
      });

      // Enable only PDF417 (back of US Driver's License)
      // and speed up by disabling everything else.
      const settings = new ScanditSDK.ScanSettings();
      settings.setSymbologyEnabled(ScanditSDK.Barcode.Symbology.PDF417, true);
      await picker.applyScanSettings(settings);

      picker.on("scan", result => {
        const raw = result?.barcodes?.[0]?.data || "";
        const dob = extractDOBFromAAMVA(raw); // parse DBB field (DoB)
        if (!dob) {
          alert("Couldn’t read Date of Birth. Please try again and hold steady.");
          return;
        }
        if (!is21Plus(dob)) {
          alert("You must be 21+ to checkout.");
          picker.pauseScanning();
          closeScanner();
          return;
        }
        // Mark verified without storing PII
        localStorage.setItem("idVerified", JSON.stringify({ ok: true, ts: Date.now() }));
        picker.pauseScanning();
        closeScanner();
        proceedToSquareCheckout();
      });
    }

    await picker.resumeScanning();
  }

  // Parse AAMVA data string to extract DOB (DBB)
  function extractDOBFromAAMVA(text) {
    if (!text) return null;
    // The AAMVA DBB field is 8 digits; jurisdictions use MMDDYYYY or YYYYMMDD.
    // We detect format by looking at the first 2 digits (month vs year).
    const m = text.match(/DBB(\d{8})/);
    if (!m) return null;
    const v = m[1];
    let yyyy, mm, dd;
    const firstTwo = parseInt(v.slice(0, 2), 10);
    if (firstTwo > 12) { // YYYYMMDD
      yyyy = parseInt(v.slice(0, 4), 10);
      mm   = parseInt(v.slice(4, 6), 10) - 1;
      dd   = parseInt(v.slice(6, 8), 10);
    } else {             // MMDDYYYY
      mm   = parseInt(v.slice(0, 2), 10) - 1;
      dd   = parseInt(v.slice(2, 4), 10);
      yyyy = parseInt(v.slice(4, 8), 10);
    }
    const d = new Date(yyyy, mm, dd);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function is21Plus(dob) {
    const now = new Date();
    const twentyOne = new Date(dob.getFullYear() + 21, dob.getMonth(), dob.getDate());
    return now >= twentyOne;
  }

  // ---------- INITIAL LOAD ----------
  updateCartCount();
  renderCart();
});
