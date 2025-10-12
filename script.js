document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo JS booting...");

  // ---------- HELPERS ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const debugBar = $("#debug");
  const debug = (msg, ok = false) => {
    if (!debugBar) return;
    debugBar.textContent = msg;
    debugBar.style.background = ok ? "#022" : "#220";
    debugBar.style.color = ok ? "#7fffb3" : "#ff6666";
    debugBar.hidden = false;
  };

  // ---------- AGE VERIFICATION ----------
  const ageOverlay = $("#age-overlay");
  on($("#yesBtn"), "click", () => (ageOverlay.style.display = "none"));
  on($("#noBtn"), "click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    location.href = "https://google.com";
  });

  // ---------- CART ----------
  const cartBtn = $("#cart-btn");
  const cartList = $("#cart-items");
  const cartCount = $("#cart-count");
  const totalEl = $("#cart-total");
  const checkoutBtn = $("#checkout-btn");

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  function updateCartUI() {
    if (!cartList) return;
    cartList.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
      total += Number(item.price) || 0;
      const li = document.createElement("li");
      li.innerHTML = `${item.name} - $${item.price.toFixed(2)} 
        <button class="remove" data-i="${i}">❌</button>`;
      cartList.appendChild(li);
    });
    totalEl.textContent = `Total: $${total.toFixed(2)}`;
    cartCount.textContent = cart.length;
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  on(cartList, "click", (e) => {
    const btn = e.target.closest(".remove");
    if (!btn) return;
    const i = Number(btn.dataset.i);
    if (!isNaN(i)) {
      cart.splice(i, 1);
      updateCartUI();
    }
  });

  on(checkoutBtn, "click", () => {
    if (!cart.length) return alert("Your cart is empty!");
    alert("🛒 Checkout complete! Loyalty star added.");
    addLoyaltyStar();
    cart = [];
    updateCartUI();
  });

  updateCartUI();

  // ---------- LOYALTY STARS ----------
  const stars = $$("#loyalty-stars .star");
  let loyaltyCount = parseInt(localStorage.getItem("loyaltyCount") || "0", 10);

  function renderStars() {
    stars.forEach((s, i) => s.classList.toggle("active", i < loyaltyCount));
  }

  function addLoyaltyStar() {
    loyaltyCount++;
    if (loyaltyCount >= 6) {
      alert("🎉 You earned a free vape!");
      loyaltyCount = 0;
    }
    localStorage.setItem("loyaltyCount", loyaltyCount);
    renderStars();
  }

  renderStars();

  // ---------- FIREBASE PRODUCTS ----------
  const productList = $("#product-list");
  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'><rect width='100%' height='100%' fill='%23111'/><rect x='12' y='12' width='456' height='336' rx='18' fill='black' stroke='%23ff8c00' stroke-width='6'/><text x='50%25' y='55%25' text-anchor='middle' font-family='Arial' font-size='42' fill='%23ff8c00'>LBizzo</text></svg>";

  async function loadProducts() {
    try {
      if (!window.db) throw new Error("Firebase not initialized.");
      const snap = await db.collection("products").get();
      if (snap.empty) {
        debug("No products found in Firestore. Using demo.", false);
        loadDemoProducts();
        return;
      }
      debug(`Connected to Firestore • ${snap.size} product(s)`, true);
      productList.innerHTML = "";
      snap.forEach((doc) => addCard(doc.data()));
    } catch (err) {
      console.error("Firestore load error:", err);
      loadDemoProducts();
    }
  }

  function loadDemoProducts() {
    const demo = [
      { name: "LBizzo Mango Ice", price: 12.99 },
      { name: "LBizzo Blue Razz", price: 13.49 },
      { name: "LBizzo Strawberry", price: 11.99 },
      { name: "LBizzo Watermelon", price: 14.25 },
      { name: "LBizzo Grape Ice", price: 12.49 },
      { name: "LBizzo Peach", price: 13.75 },
    ];
    productList.innerHTML = "";
    demo.forEach(addCard);
  }

  function addCard(p) {
    const priceNum = Number(p.price) || 0;
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${p.image || PLACEHOLDER_IMG}" alt="${p.name}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <h3>${p.name}</h3>
      <p>$${priceNum.toFixed(2)}</p>
      <button class="add-btn">Add to Cart</button>
    `;
    card.querySelector(".add-btn").addEventListener("click", () => {
      cart.push({ name: p.name, price: priceNum });
      updateCartUI();
    });
    productList.appendChild(card);
  }

  await loadProducts();

  // ---------- SCANDIT ID SCANNER ----------
  const scanStart = $("#scanStart");
  const scanStop = $("#scanStop");
  const scanOut = $("#scanOut");
  let scanner;

  on(scanStart, "click", async () => {
    try {
      if (!ScanditSDK || !ScanditSDK.BarcodePicker) {
        scanOut.textContent = "❌ Scanner not supported on this device.";
        return;
      }
      scanner = await ScanditSDK.BarcodePicker.create($("#scanVideo"), {
        playSoundOnScan: true,
        vibrateOnScan: true,
      });
      const settings = new ScanditSDK.ScanSettings({
        enabledSymbologies: ["pdf417", "qr"],
        codeDuplicateFilter: 1000,
      });
      scanner.applyScanSettings(settings);
      scanner.on("scan", (result) => {
        scanOut.textContent = "✅ Scanned: " + result.barcodes[0].data;
      });
      scanOut.textContent = "Scanner started. Point camera at barcode.";
    } catch (err) {
      scanOut.textContent = "❌ Scanner not supported on this device.";
      console.error(err);
    }
  });

  on(scanStop, "click", () => {
    if (scanner) {
      scanner.destroy();
      scanOut.textContent = "Scanner stopped.";
    }
  });
});
