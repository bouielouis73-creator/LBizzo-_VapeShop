// ============================================================
// ✅ LBizzo Vape Shop – Restored working build
// Firebase (products), EmailJS checkout, Scandit ID (simulated),
// Loyalty stars, Cart, Age Gate, PWA Ready.
// ============================================================

(() => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;

  console.log("✅ LBizzo script booting...");

  // ---------- Firebase Config ----------
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.appspot.com",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
    databaseURL: "https://lbizzodelivery-default-rtdb.firebaseio.com"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ---------- EmailJS ----------
  const EMAILJS_PUBLIC_KEY = "jUx6gEqKl1tvL7yLs";
  const EMAILJS_SERVICE_ID = "service_bk310ht";
  const EMAILJS_TEMPLATE_ID = "template_sbbt8blk";
  emailjs.init(EMAILJS_PUBLIC_KEY);

  // ---------- Helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const debug = (msg) => { console.log(msg); $("#debug").textContent = msg; };

  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%' height='100%' fill='#111'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#ff8c00' font-family='Arial' font-size='16'>No Image</text></svg>`
    );

  // ---------- Age Check ----------
  const overlay = $("#age-check");
  $("#yesBtn")?.addEventListener("click", () => (overlay.style.display = "none"));
  $("#noBtn")?.addEventListener("click", () => {
    alert("Sorry, you must be 21+ to enter.");
    window.location.href = "https://google.com";
  });
  overlay.style.display = "grid";

  // ---------- Loyalty Stars ----------
  const MAX_STARS = 6;
  function renderStars() {
    const stars = $("#stars");
    stars.innerHTML = "";
    const have = Number(localStorage.getItem("lb_stars") || "0");
    for (let i = 0; i < MAX_STARS; i++) {
      const s = document.createElement("span");
      s.textContent = "⭐";
      if (i < have) s.style.color = "#ff8c00";
      stars.appendChild(s);
    }
  }
  function addStar() {
    let stars = Number(localStorage.getItem("lb_stars") || "0");
    stars = Math.min(MAX_STARS, stars + 1);
    localStorage.setItem("lb_stars", stars);
    renderStars();
  }

  // ---------- Firebase Storage helper ----------
  async function getImageURL(fileName) {
    try {
      const path = fileName.startsWith("products/")
        ? fileName
        : `products/${fileName}`;
      return await storage.ref().child(path).getDownloadURL();
    } catch (e) {
      console.warn("Image not found:", fileName);
      return PLACEHOLDER_IMG;
    }
  }

  // ---------- Load Products ----------
  async function loadProducts() {
    const list = $("#product-list");
    list.innerHTML = "<p>Loading...</p>";

    try {
      const snap = await db.collection("products").limit(50).get();
      if (snap.empty) {
        list.innerHTML = "<p>No products found in Firestore.</p>";
        return;
      }
      list.innerHTML = "";
      for (const doc of snap.docs) {
        const p = doc.data();
        const img = await getImageURL(p.image);
        const price = Number(p.price) || 0;
        const card = document.createElement("div");
        card.className = "product";
        card.innerHTML = `
          <img src="${img}" alt="${p.name}" />
          <div class="pad">
            <h3>${p.name}</h3>
            <p>$${price.toFixed(2)}</p>
            <button class="add-btn">Add to Cart</button>
          </div>
        `;
        card.querySelector(".add-btn").addEventListener("click", () =>
          addToCart(p.name, price)
        );
        list.appendChild(card);
      }
      debug("✅ Products loaded successfully");
    } catch (err) {
      debug("❌ Error loading products: " + err.message);
    }
  }

  // ---------- Cart ----------
  let cart = [];
  const cartEl = $("#cart");
  const itemsEl = $("#cart-items");
  const totalEl = $("#cart-total");
  const countEl = $("#cart-count");
  const checkoutBtn = $("#checkout-btn");
  const scanBtn = $("#scan-btn");
  const cartBtn = $("#cart-btn");

  let idVerified = false;

  cartBtn.addEventListener("click", () => (cartEl.hidden = !cartEl.hidden));

  function renderCart() {
    itemsEl.innerHTML = "";
    let total = 0;
    cart.forEach((c, i) => {
      const li = document.createElement("li");
      li.innerHTML = `${c.name} - $${c.price.toFixed(2)} × ${c.qty}
        <button data-i="${i}">−</button>`;
      li.querySelector("button").addEventListener("click", () => {
        c.qty--;
        if (c.qty <= 0) cart.splice(i, 1);
        renderCart();
      });
      itemsEl.appendChild(li);
      total += c.price * c.qty;
    });
    totalEl.textContent = total.toFixed(2);
    countEl.textContent = cart.reduce((s, c) => s + c.qty, 0);
    checkoutBtn.disabled = !idVerified || cart.length === 0;
  }

  function addToCart(name, price) {
    const found = cart.find((c) => c.name === name);
    if (found) found.qty++;
    else cart.push({ name, price, qty: 1 });
    renderCart();
  }

  // ---------- Scandit (simulated) ----------
  const scannerBox = $("#scanner");
  const video = $("#preview");
  const closeScan = $("#close-scan");
  let stream;

  async function startScanner() {
    scannerBox.hidden = false;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      setTimeout(() => {
        setVerified(true);
        stopScanner();
        alert("✅ ID Verified");
      }, 3000);
    } catch (err) {
      alert("Camera not available: " + err.message);
    }
  }

  function stopScanner() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    scannerBox.hidden = true;
  }

  function setVerified(ok) {
    idVerified = ok;
    checkoutBtn.disabled = !ok || cart.length === 0;
  }

  scanBtn.addEventListener("click", startScanner);
  closeScan.addEventListener("click", stopScanner);

  // ---------- Checkout ----------
  checkoutBtn.addEventListener("click", async () => {
    if (!idVerified) return alert("Please scan your ID first!");
    if (!cart.length) return alert("Cart is empty!");

    const name = prompt("Your name:");
    const phone = prompt("Phone number:");
    const address = prompt("Delivery address:");
    if (!name || !phone || !address) return;

    const order = {
      name,
      phone,
      address,
      items: cart.map(c => `${c.name} x${c.qty}`).join("\n"),
      total: cart.reduce((s, c) => s + c.price * c.qty, 0).toFixed(2),
    };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, order);
      alert("✅ Order sent!");
      addStar();
      cart = [];
      renderCart();
    } catch (e) {
      alert("❌ Email failed: " + e.message);
    }
  });

  // ---------- Init ----------
  window.addEventListener("DOMContentLoaded", async () => {
    renderStars();
    await loadProducts();
    renderCart();
  });
})();
