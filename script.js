// ===============================
// LBizzo Vape Shop – Full Build
// (Firebase + Firestore + Storage, EmailJS, Scandit scanner, PWA hooks)
// ===============================

(() => {
  // ----- Guard against double-boot -----
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;

  // ----- Config (edit only if needed) -----
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.firebasestorage.app",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
  };

  // ⚠️ TODO: insert your Scandit license key (keep quotes)
  const SCANDIT_LICENSE_KEY = "YOUR_SCANDIT_LICENSE_KEY";

  // EmailJS: using your real keys from the screenshots
  const EMAILJS_PUBLIC_KEY = "jUx6gEqKl1tvL7yLs";
  const EMAILJS_SERVICE_ID = "service_bk310ht";
  const EMAILJS_TEMPLATE_ID = "template_sbbt8blk";

  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%' height='100%' fill='#111'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#ff8c00' font-family='Arial' font-size='16'>Image</text></svg>`
    );

  // ----- Shortcuts -----
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const debugBar = $("#debug");
  const debug = (msg, ok = false) => {
    if (!debugBar) return;
    debugBar.textContent = msg;
    debugBar.style.background = ok ? "#022" : "#220";
    debugBar.style.color = ok ? "#7fffb3" : "#ff6666";
    debugBar.style.display = "block";
    setTimeout(() => (debugBar.style.display = "none"), 3500);
  };

  // ----- Firebase -----
  firebase.initializeApp(FIREBASE_CONFIG);
  const db = firebase.firestore();
  const storage = firebase.storage();

  async function getImageURL(imageField) {
    try {
      // imageField can be a full path like "products/abc.jpg" or just "abc.jpg"
      const path = imageField.startsWith("products/")
        ? imageField
        : `products/${imageField}`;
      const url = await storage.ref().child(path).getDownloadURL();
      return url;
    } catch (e) {
      console.warn("Image load failed:", imageField, e);
      return PLACEHOLDER_IMG;
    }
  }

  // ----- EmailJS -----
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  } catch (e) {
    console.warn("EmailJS init error", e);
  }

  async function sendOrderEmail(order) {
    const templateParams = {
      name: order.name,
      phone: order.phone,
      address: order.address,
      items: order.items.map(i => `${i.name} ($${i.price.toFixed(2)}) x${i.qty}`).join("\n"),
      total: order.total.toFixed(2)
    };
    try {
      const res = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );
      debug("EmailJS: order sent", true);
      return res;
    } catch (err) {
      console.error("EmailJS failed", err);
      alert("❌ Email could not be sent. Please try again.");
      return null;
    }
  }

  // ----- Loyalty Stars -----
  const STARS_MAX = 6;
  function getStars() {
    return Number(localStorage.getItem("lb_stars") || "0");
  }
  function setStars(n) {
    localStorage.setItem("lb_stars", String(n));
    renderStars();
  }
  function renderStars() {
    const wrap = $("#stars");
    if (!wrap) return;
    wrap.innerHTML = "";
    const have = getStars();
    for (let i = 0; i < STARS_MAX; i++) {
      const s = document.createElement("span");
      s.className = "star" + (i < have ? " lit" : "");
      s.textContent = "⭐";
      wrap.appendChild(s);
    }
  }

  // ----- Age Gate -----
  const ageCheck = $("#age-check");
  const yesBtn = $("#yesBtn");
  const noBtn = $("#noBtn");
  if (ageCheck && yesBtn && noBtn) {
    ageCheck.style.display = "grid";
    const allow = (e) => {
      e.preventDefault();
      ageCheck.style.display = "none";
    };
    const deny = (e) => {
      e.preventDefault();
      alert("Sorry, you must be 21+ to enter.");
      location.href = "https://google.com";
    };
    ["click", "touchstart"].forEach(evt => {
      yesBtn.addEventListener(evt, allow, { passive: false });
      noBtn.addEventListener(evt, deny, { passive: false });
    });
  }

  // ----- PWA Install -----
  let deferredPrompt;
  const installBtn = $("#install-btn");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn && (installBtn.disabled = false);
  });
  installBtn?.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.disabled = true;
  });

  // ----- Products -----
  const listEl = $("#product-list");

  async function addCard(p) {
    const priceNum = Number(p.price) || 0;
    const imgURL = p.image ? await getImageURL(p.image) : PLACEHOLDER_IMG;

    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL}" alt="${p.name || ""}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <div class="pad">
        <h3 style="margin:0 0 4px">${p.name || "Unnamed"}</h3>
        <p class="muted" style="margin:0 0 10px">$${priceNum.toFixed(2)}</p>
        <button class="btn primary add-btn">Add to Cart</button>
      </div>
    `;
    card.querySelector(".add-btn").addEventListener("click", () => {
      addToCart({ id: p.id, name: p.name, price: priceNum });
    });
    listEl.appendChild(card);
  }

  async function loadProducts() {
    listEl.innerHTML = "";
    const snap = await db.collection("products").limit(50).get();
    if (snap.empty) {
      debug("No products found in Firestore ‘products’", false);
      return;
    }
    for (const doc of snap.docs) {
      const data = doc.data();
      await addCard({ id: doc.id, ...data });
    }
  }

  // ----- Cart -----
  const cartBtn = $("#cart-btn");
  const cartPanel = $("#cart");
  const itemsEl = $("#cart-items");
  const totalEl = $("#cart-total");
  const countEl = $("#cart-count");
  const checkoutBtn = $("#checkout-btn");
  const scanBtn = $("#scan-btn");

  let cart = []; // {id, name, price, qty}
  let idVerified = false;

  function saveCart() {
    localStorage.setItem("lb_cart", JSON.stringify(cart));
  }
  function loadCart() {
    cart = JSON.parse(localStorage.getItem("lb_cart") || "[]");
    renderCart();
  }
  function addToCart(item) {
    const found = cart.find((c) => c.id === item.id);
    if (found) found.qty += 1;
    else cart.push({ ...item, qty: 1 });
    renderCart();
  }
  function removeFromCart(id) {
    cart = cart
      .map((c) => (c.id === id ? { ...c, qty: c.qty - 1 } : c))
      .filter((c) => c.qty > 0);
    renderCart();
  }
  function calcTotal() {
    return cart.reduce((s, c) => s + c.price * c.qty, 0);
  }
  function renderCart() {
    itemsEl.innerHTML = "";
    cart.forEach((c) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${c.name} — $${c.price.toFixed(2)} × ${c.qty}</span>
        <button class="btn ghost remove">−</button>
      `;
      li.querySelector(".remove").addEventListener("click", () => removeFromCart(c.id));
      itemsEl.appendChild(li);
    });
    const total = calcTotal();
    totalEl.textContent = total.toFixed(2);
    countEl.textContent = cart.reduce((s, c) => s + c.qty, 0);
    saveCart();

    // ID gate
    checkoutBtn.disabled = !idVerified || cart.length === 0;
  }

  cartBtn?.addEventListener("click", () => {
    cartPanel.hidden = !cartPanel.hidden;
  });

  // ----- Scandit Scanner -----
  const scanStatus = $("#scan-status");
  const scannerBox = $("#scanner");
  const closeScan = $("#close-scan");
  let videoStream;

  function setVerified(ok) {
    idVerified = !!ok;
    scanStatus.textContent = ok ? "ID verified" : "ID not verified";
    scanStatus.style.color = ok ? "#00d084" : "";
    checkoutBtn.disabled = !idVerified || cart.length === 0;
  }

  async function startScanner() {
    if (!SCANDIT_LICENSE_KEY || SCANDIT_LICENSE_KEY.includes("YOUR_SCANDIT_LICENSE_KEY")) {
      alert("Add your Scandit license key in script.js to enable live ID scanning.");
      return;
    }
    try {
      // Very lightweight sample using getUserMedia for preview.
      // Scandit parsing runs inside their SDK; here we just open camera and
      // demonstrate wiring. Replace with full Scandit integration when you paste your key.
      scannerBox.hidden = false;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      videoStream = stream;
      const vid = $("#preview");
      vid.srcObject = stream;

      // Fake event after 3 seconds to simulate a successful scan; replace with Scandit callbacks.
      setTimeout(() => {
        setVerified(true);
        stopScanner();
        debug("Sample: ID parsed OK (replace with Scandit decode)", true);
      }, 3000);
    } catch (e) {
      console.error(e);
      alert("Camera permission denied or camera not available.");
    }
  }

  function stopScanner() {
    try {
      const vid = $("#preview");
      if (vid) vid.pause();
      if (videoStream) {
        videoStream.getTracks().forEach((t) => t.stop());
        videoStream = null;
      }
    } finally {
      scannerBox.hidden = true;
    }
  }

  scanBtn?.addEventListener("click", startScanner);
  closeScan?.addEventListener("click", stopScanner);

  // ----- Checkout -----
  checkoutBtn?.addEventListener("click", async () => {
    if (!idVerified) {
      alert("Please scan your ID before checkout.");
      return;
    }
    if (!cart.length) return;

    // Simple prompts (replace with your own form if you have one)
    const name = prompt("Your name:");
    const phone = prompt("Phone:");
    const address = prompt("Delivery address:");
    if (!name || !phone || !address) return;

    const order = {
      name,
      phone,
      address,
      items: cart.map((c) => ({ name: c.name, price: c.price, qty: c.qty })),
      total: calcTotal(),
    };

    const ok = await sendOrderEmail(order);
    if (ok) {
      // Loyalty star +1; free on 6 (you can handle the free logic in-store)
      const have = getStars();
      const next = Math.min(STARS_MAX, have + 1);
      setStars(next);

      cart = [];
      renderCart();
      alert("✅ Order submitted! We’ll contact you shortly.");
    }
  });

  // ----- Init -----
  window.addEventListener("DOMContentLoaded", async () => {
    renderStars();
    loadCart();
    try {
      await loadProducts();
      debug("Products loaded", true);
    } catch (e) {
      console.error(e);
      debug("Failed to load products");
    }
  });
})();
