document.addEventListener("DOMContentLoaded", () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo booting…");

  // ===== Helpers =====
  const $ = (s, r = document) => r.querySelector(s);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const debugBar = $("#debug");
  const debug = (m, ok=false) => {
    if (!debugBar) return;
    debugBar.textContent = m;
    debugBar.style.background = ok ? "#022" : "#220";
    debugBar.style.color = ok ? "#7fffb3" : "#ff6666";
    debugBar.hidden = false;
  };

  // ===== EmailJS =====
  if (window.emailjs && !window.__EMAILJS_INIT__) {
    window.__EMAILJS_INIT__ = true;
    emailjs.init("YOUR_EMAILJS_PUBLIC_KEY"); // <-- put your EmailJS public key
  }

  // ===== Age Gate =====
  const ageCheck = $("#age-check");
  on($("#yesBtn"), "click", () => ageCheck && (ageCheck.style.display = "none"));
  on($("#noBtn"), "click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    location.href = "https://google.com";
  });

  // ===== Cart =====
  const cartList = $("#cart-items");
  const cartCount = $("#cart-count");
  const totalEl = $("#cart-total");
  const checkoutBtn = $("#checkout-btn");
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  function updateCartUI() {
    cartList.innerHTML = "";
    let total = 0;
    cart.forEach((it, i) => {
      const p = Number(it.price) || 0;
      total += p;
      const li = document.createElement("li");
      li.innerHTML = `${it.name} - $${p.toFixed(2)} <button class="remove" data-i="${i}">❌</button>`;
      cartList.appendChild(li);
    });
    totalEl.textContent = `Total: $${total.toFixed(2)}`;
    cartCount.textContent = cart.length;
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  on(cartList, "click", (e) => {
    const btn = e.target.closest(".remove");
    if (!btn) return;
    const idx = Number(btn.dataset.i);
    if (!Number.isNaN(idx)) {
      cart.splice(idx, 1);
      updateCartUI();
    }
  });
  updateCartUI();

  // ===== Loyalty =====
  const stars = document.querySelectorAll("#loyalty-stars .star");
  let loyalty = parseInt(localStorage.getItem("loyaltyCount") || "0", 10);
  const renderStars = () => stars.forEach((s, i) => s.classList.toggle("active", i < loyalty));
  function addLoyaltyStar() {
    loyalty++;
    if (loyalty >= 6) { alert("🎉 Free vape earned!"); loyalty = 0; }
    localStorage.setItem("loyaltyCount", String(loyalty));
    renderStars();
  }
  renderStars();

  // ===== Products (Firestore with demo fallback) =====
  const productList = $("#product-list");
  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'><rect width='100%' height='100%' fill='%23111'/><rect x='12' y='12' width='456' height='336' rx='18' fill='black' stroke='%23ff8c00' stroke-width='6'/><text x='50%25' y='55%25' text-anchor='middle' font-family='Arial' font-size='42' fill='%23ff8c00'>LBizzo</text></svg>";

  function addCard(p) {
    const priceNum = Number(p.price) || 0;
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${p.image || PLACEHOLDER_IMG}" alt="${p.name || "Product"}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <h3>${p.name || "Unnamed"}</h3>
      <p>$${priceNum.toFixed(2)}</p>
      <button class="add-btn">Add to Cart</button>`;
    card.querySelector(".add-btn").addEventListener("click", () => {
      cart.push({ name: p.name || "Item", price: priceNum });
      updateCartUI();
    });
    productList.appendChild(card);
  }

  function demoProducts() {
    productList.innerHTML = "";
    [
      { name: "LBizzo Mango Ice", price: 12.99 },
      { name: "LBizzo Blue Razz", price: 13.49 },
      { name: "LBizzo Strawberry", price: 11.99 }
    ].forEach(addCard);
  }

  (async () => {
    try {
      if (!window.db || !firebase) throw new Error("Firestore not available");
      const snap = await db.collection("products").get();
      if (!snap || snap.empty) throw new Error("No products");
      debug(`Connected to Firestore • ${snap.size} product(s)`, true);
      productList.innerHTML = "";
      snap.forEach((doc) => addCard(doc.data()));
    } catch (err) {
      debug(`Using demo products (${err.message})`);
      demoProducts();
    }
  })();

  // ===== Checkout (EmailJS + Square link) =====
  on(checkoutBtn, "click", async () => {
    if (!cart.length) return alert("Your cart is empty!");
    const total = cart.reduce((s, it) => s + (Number(it.price) || 0), 0).toFixed(2);
    try {
      if (window.emailjs) {
        await emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
          order_items: cart.map(i => i.name).join(", "),
          order_total: total
        });
      }
      addLoyaltyStar();
      cart = [];
      updateCartUI();
      alert("🛒 Order sent! Proceeding to payment…");
      window.open("https://square.link/u/GOvQxhqG?amount=" + total, "_blank");
    } catch (e) {
      alert("⚠️ Could not send order: " + (e && e.text ? e.text : e));
    }
  });

}); // DOMContentLoaded

// ===== Service Worker =====
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("✅ Service Worker registered"))
    .catch(err => console.error("❌ Service Worker failed:", err));
}

// ===== Install prompt button =====
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById("install-btn");
  if (!btn) return;
  btn.hidden = false;
  btn.onclick = async () => {
    btn.hidden = true;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  };
});

// ===== ID Scanner (BarcodeDetector PDF417/QR with fallback) =====
(() => {
  const video = document.getElementById("scanVideo");
  const out = document.getElementById("scanOut");
  const start = document.getElementById("scanStart");
  const stop = document.getElementById("scanStop");
  if (!video || !start || !stop || !out) return;

  let stream = null, raf = null, detector = null;

  async function initDetector() {
    if ("BarcodeDetector" in window) {
      try {
        detector = new BarcodeDetector({ formats: ["pdf417", "qr_code"] });
      } catch { detector = null; }
    }
  }

  async function startScan() {
    await initDetector();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      await video.play();
      out.textContent = "Scanning… (point camera at back of ID or QR)";
      tick();
    } catch (e) {
      out.textContent = "Camera error: " + e.message;
    }
  }

  function stopScan() {
    cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach(t => t.stop());
    video.srcObject = null;
    out.textContent += "\nStopped.";
  }

  async function tick() {
    if (!detector) { out.textContent = "Scanner not supported on this device."; return; }
    try {
      const codes = await detector.detect(video);
      if (codes && codes.length) {
        out.textContent = "Detected:\n" + codes.map(c => c.rawValue).join("\n\n");
        // You can parse PDF417 payload here if you want DOB/Name, etc.
      }
    } catch (e) {
      // ignore frame errors
    }
    raf = requestAnimationFrame(tick);
  }

  start.addEventListener("click", startScan);
  stop.addEventListener("click", stopScan);
})();
