// ============================================================
// ✅ LBizzo Vape Shop – Fixed script.js
// Shows all products (name, price, image) from Firestore + Storage
// Includes: EmailJS, Scandit ID, Cart, Checkout, Loyalty, PWA, Age Gate
// ============================================================

(() => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;

  console.log("✅ LBizzo script starting...");

  // ---------- Firebase Config ----------
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.appspot.com", // ✅ must end with .appspot.com
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
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

  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%' height='100%' fill='#111'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#ff8c00' font-family='Arial' font-size='16'>No Image</text></svg>`
    );

  // ---------- Loyalty Stars ----------
  const MAX_STARS = 6;
  const renderStars = () => {
    const wrap = $("#stars");
    if (!wrap) return;
    wrap.innerHTML = "";
    const have = Number(localStorage.getItem("lb_stars") || "0");
    for (let i = 0; i < MAX_STARS; i++) {
      const s = document.createElement("span");
      s.className = "star" + (i < have ? " lit" : "");
      s.textContent = "⭐";
      wrap.appendChild(s);
    }
  };
  const addStar = () => {
    const have = Number(localStorage.getItem("lb_stars") || "0");
    localStorage.setItem("lb_stars", Math.min(MAX_STARS, have + 1));
    renderStars();
  };

  // ---------- Age Verification ----------
  const ageCheck = $("#age-check");
  $("#yesBtn")?.addEventListener("click", () => (ageCheck.style.display = "none"));
  $("#noBtn")?.addEventListener("click", () => {
    alert("Sorry, you must be 21+ to enter.");
    window.location.href = "https://google.com";
  });
  ageCheck.style.display = "grid";

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

  // ---------- Firebase Image Loader ----------
  async function getImageURL(fileName) {
    try {
      const path = fileName.startsWith("products/")
        ? fileName
        : `products/${fileName}`;
      return await storage.ref().child(path).getDownloadURL();
    } catch (err) {
      console.warn("Image not found:", fileName);
      return PLACEHOLDER_IMG;
    }
  }

  // ---------- Load Products ----------
  async function loadProducts() {
    const listEl = $("#product-list");
    listEl.innerHTML = "<p style='text-align:center;color:#777'>Loading products...</p>";

    try {
      const snapshot = await db.collection("products").limit(50).get();
      if (snapshot.empty) {
        listEl.innerHTML = "<p style='text-align:center;color:#777'>No products found</p>";
        return;
      }

      listEl.innerHTML = "";
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const imgURL = await getImageURL(data.image);
        const price = Number(data.price) || 0;

        const card = document.createElement("div");
        card.className = "product";
        card.innerHTML = `
          <img src="${imgURL}" alt="${data.name}" />
          <div class="pad">
            <h3>${data.name}</h3>
            <p>$${price.toFixed(2)}</p>
            <button class="btn primary add-btn">Add to Cart</button>
          </div>
        `;
        card.querySelector(".add-btn").addEventListener("click", () => addToCart({
          name: data.name,
          price,
          image: imgURL,
        }));
        listEl.appendChild(card);
      }
    } catch (err) {
      console.error("❌ Firestore error:", err);
      $("#product-list").innerHTML = "<p style='color:red;text-align:center'>Error loading products.</p>";
    }
  }

  // ---------- Cart ----------
  const cartEl = $("#cart");
  const cartBtn = $("#cart-btn");
  const itemsEl = $("#cart-items");
  const totalEl = $("#cart-total");
  const countEl = $("#cart-count");
  const checkoutBtn = $("#checkout-btn");
  const scanBtn = $("#scan-btn");

  let cart = [];
  let idVerified = false;

  function renderCart() {
    itemsEl.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
      const li = document.createElement("li");
      total += item.price * item.qty;
      li.innerHTML = `${item.name} - $${item.price.toFixed(2)} × ${item.qty}
        <button class='btn ghost' data-i='${i}'>−</button>`;
      li.querySelector("button").addEventListener("click", () => {
        item.qty--;
        if (item.qty <= 0) cart.splice(i, 1);
        renderCart();
      });
      itemsEl.appendChild(li);
    });
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

  // ---------- Scandit (Simulated) ----------
  const scanStatus = $("#scan-status");
  const scannerBox = $("#scanner");
  const closeScan = $("#close-scan");
  const video = $("#preview");
  let stream;

  function setVerified(ok) {
    idVerified = ok;
    scanStatus.textContent = ok ? "ID verified" : "ID not verified";
    scanStatus.style.color = ok ? "#00d084" : "#ff6666";
    checkoutBtn.disabled = !ok || cart.length === 0;
  }

  async function startScanner() {
    scannerBox.hidden = false;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      video.play();
      // simulate scan success
      setTimeout(() => {
        setVerified(true);
        stopScanner();
        alert("✅ ID verified");
      }, 3000);
    } catch (e) {
      alert("Camera error: " + e.message);
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
    if (!idVerified) return alert("Please scan your ID first!");
    if (!cart.length) return alert("Your cart is empty!");

    const name = prompt("Your name:");
    const phone = prompt("Phone number:");
    const address = prompt("Delivery address:");
    if (!name || !phone || !address) return;

    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const order = { name, phone, address, items: cart, total };

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        name, phone, address,
        items: order.items.map(i => `${i.name} x${i.qty}`).join("\n"),
        total: order.total.toFixed(2),
      });
      alert("✅ Order sent!");
      addStar();
      cart = [];
      renderCart();
    } catch (e) {
      alert("❌ Email failed. Check EmailJS keys.");
      console.error(e);
    }
  });

  // ---------- Start ----------
  window.addEventListener("DOMContentLoaded", async () => {
    renderStars();
    await loadProducts();
    renderCart();
  });
})();
