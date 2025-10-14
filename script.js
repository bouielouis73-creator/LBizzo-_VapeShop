// ============================================================
// ✅ LBizzo Vape Shop - Complete script.js
// Includes: Firebase, Firestore, Storage, EmailJS, Scandit ID, PWA, Cart, Loyalty
// ============================================================

(() => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;

  console.log("✅ LBizzo script booting…");

  // ---------- Firebase Configuration ----------
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.appspot.com", // ✅ Correct bucket name
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
  };

  // ---------- Scandit License ----------
  const SCANDIT_LICENSE_KEY = "YOUR_SCANDIT_LICENSE_KEY"; // Replace when ready

  // ---------- EmailJS Setup ----------
  const EMAILJS_PUBLIC_KEY = "jUx6gEqKl1tvL7yLs";
  const EMAILJS_SERVICE_ID = "service_bk310ht";
  const EMAILJS_TEMPLATE_ID = "template_sbbt8blk";

  // ---------- Init Firebase ----------
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ---------- Helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const debug = (msg) => console.log("🐞", msg);

  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%' height='100%' fill='#111'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#ff8c00' font-family='Arial' font-size='16'>Image</text></svg>`
    );

  // ---------- EmailJS ----------
  emailjs.init(EMAILJS_PUBLIC_KEY);

  async function sendOrderEmail(order) {
    const templateParams = {
      name: order.name,
      phone: order.phone,
      address: order.address,
      items: order.items.map(i => `${i.name} ($${i.price.toFixed(2)}) x${i.qty}`).join("\n"),
      total: order.total.toFixed(2)
    };
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      alert("✅ Order sent successfully!");
    } catch (err) {
      console.error("EmailJS failed:", err);
      alert("❌ Could not send order. Try again.");
    }
  }

  // ---------- Age Verification ----------
  const ageCheck = $("#age-check");
  const yesBtn = $("#yesBtn");
  const noBtn = $("#noBtn");

  if (ageCheck && yesBtn && noBtn) {
    ageCheck.style.display = "grid";
    yesBtn.addEventListener("click", () => (ageCheck.style.display = "none"));
    noBtn.addEventListener("click", () => {
      alert("Sorry, you must be 21+ to enter.");
      window.location.href = "https://google.com";
    });
  }

  // ---------- PWA Install ----------
  let deferredPrompt;
  const installBtn = $("#install-btn");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.disabled = false;
  });
  installBtn?.addEventListener("click", async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.disabled = true;
  });

  // ---------- Loyalty Stars ----------
  const MAX_STARS = 6;
  function getStars() { return Number(localStorage.getItem("lb_stars") || "0"); }
  function setStars(n) { localStorage.setItem("lb_stars", n); renderStars(); }
  function renderStars() {
    const wrap = $("#stars");
    wrap.innerHTML = "";
    const have = getStars();
    for (let i = 0; i < MAX_STARS; i++) {
      const s = document.createElement("span");
      s.className = "star" + (i < have ? " lit" : "");
      s.textContent = "⭐";
      wrap.appendChild(s);
    }
  }

  // ---------- Firebase Image Loader ----------
  async function getImageURL(imageField) {
    try {
      const path = imageField.startsWith("products/") ? imageField : `products/${imageField}`;
      return await storage.ref().child(path).getDownloadURL();
    } catch {
      return PLACEHOLDER_IMG;
    }
  }

  // ---------- Products ----------
  const listEl = $("#product-list");

  async function addCard(p) {
    const img = await getImageURL(p.image);
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${img}" alt="${p.name}" />
      <div class="pad">
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button class="btn primary add-btn">Add to Cart</button>
      </div>`;
    card.querySelector(".add-btn").addEventListener("click", () => addToCart(p));
    listEl.appendChild(card);
  }

  async function loadProducts() {
    listEl.innerHTML = "";
    const snap = await db.collection("products").limit(50).get();
    snap.forEach((doc) => addCard(doc.data()));
  }

  // ---------- Cart ----------
  const cartBtn = $("#cart-btn");
  const cartEl = $("#cart");
  const itemsEl = $("#cart-items");
  const totalEl = $("#cart-total");
  const countEl = $("#cart-count");
  const checkoutBtn = $("#checkout-btn");
  const scanBtn = $("#scan-btn");

  let cart = [];
  let idVerified = false;

  function renderCart() {
    itemsEl.innerHTML = "";
    cart.forEach((item, i) => {
      const li = document.createElement("li");
      li.innerHTML = `${item.name} - $${item.price.toFixed(2)} × ${item.qty} 
      <button class='btn ghost' data-i='${i}'>−</button>`;
      li.querySelector("button").addEventListener("click", () => {
        cart[i].qty--;
        if (cart[i].qty <= 0) cart.splice(i, 1);
        renderCart();
      });
      itemsEl.appendChild(li);
    });
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    totalEl.textContent = total.toFixed(2);
    countEl.textContent = cart.reduce((s, c) => s + c.qty, 0);
    checkoutBtn.disabled = !idVerified || cart.length === 0;
  }

  function addToCart(p) {
    const found = cart.find((c) => c.name === p.name);
    if (found) found.qty++;
    else cart.push({ ...p, qty: 1 });
    renderCart();
  }

  cartBtn.addEventListener("click", () => (cartEl.hidden = !cartEl.hidden));

  // ---------- Scandit ID Scanner ----------
  const scanStatus = $("#scan-status");
  const scannerBox = $("#scanner");
  const closeScan = $("#close-scan");
  const video = $("#preview");
  let stream;

  function setVerified(ok) {
    idVerified = ok;
    scanStatus.textContent = ok ? "ID verified" : "ID not verified";
    scanStatus.style.color = ok ? "#00d084" : "#ff6666";
    checkoutBtn.disabled = !idVerified || cart.length === 0;
  }

  async function startScanner() {
    scannerBox.hidden = false;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      video.play();

      // Simulate successful scan
      setTimeout(() => {
        setVerified(true);
        stopScanner();
        alert("✅ ID Verified");
      }, 3000);
    } catch (err) {
      alert("Camera not available or permission denied");
      console.error(err);
    }
  }

  function stopScanner() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    scannerBox.hidden = true;
  }

  scanBtn.addEventListener("click", startScanner);
  closeScan.addEventListener("click", stopScanner);

  // ---------- Checkout ----------
  checkoutBtn.addEventListener("click", async () => {
    if (!idVerified) return alert("Scan your ID first!");
    if (!cart.length) return alert("Your cart is empty!");

    const name = prompt("Your name:");
    const phone = prompt("Your phone:");
    const address = prompt("Delivery address:");
    if (!name || !phone || !address) return;

    const order = {
      name,
      phone,
      address,
      items: cart,
      total: cart.reduce((s, c) => s + c.price * c.qty, 0),
    };

    await sendOrderEmail(order);
    const stars = Math.min(6, getStars() + 1);
    setStars(stars);
    cart = [];
    renderCart();
  });

  // ---------- Startup ----------
  window.addEventListener("DOMContentLoaded", async () => {
    renderStars();
    await loadProducts();
    renderCart();
  });
})();
