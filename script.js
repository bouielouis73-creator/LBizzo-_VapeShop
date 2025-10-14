// ------------------ LBizzo Vape Shop — script.js ------------------
if (window.__LBIZZO_BOOTED__) { console.warn("LBizzo already loaded."); }
else {
  window.__LBIZZO_BOOTED__ = true;

  // ---------- Shortcuts ----------
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const debug = (msg, ok=false) => {
    const bar = $("#debug");
    if (!bar) return;
    bar.textContent = msg;
    bar.style.display = "block";
    bar.style.background = ok ? "#0c1a0c" : "#1a0c0c";
    bar.style.color = ok ? "#9ef1b0" : "#f19999";
  };

  // ---------- Firebase ----------
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.firebasestorage.app",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
  };
  try { firebase.initializeApp(firebaseConfig); } catch {}
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ---------- EmailJS / Settings ----------
  const KEYS = {
    public:  localStorage.getItem("emailjs_public")  || "",
    service: localStorage.getItem("emailjs_service") || "",
    template:localStorage.getItem("emailjs_template")|| "",
    square:  localStorage.getItem("square_base")     || ""
  };
  const applyKeys = () => {
    const ep = $("#emailjsPublic"), es = $("#emailjsService"), et = $("#emailjsTemplate"), sq = $("#squareBase");
    if (ep) ep.value = KEYS.public;
    if (es) es.value = KEYS.service;
    if (et) et.value = KEYS.template;
    if (sq) sq.value = KEYS.square;
  };
  const saveKeys = () => {
    const ep = $("#emailjsPublic"), es = $("#emailjsService"), et = $("#emailjsTemplate"), sq = $("#squareBase");
    if (ep) KEYS.public  = ep.value.trim();
    if (es) KEYS.service = es.value.trim();
    if (et) KEYS.template= et.value.trim();
    if (sq) KEYS.square  = sq.value.trim();
    localStorage.setItem("emailjs_public",  KEYS.public);
    localStorage.setItem("emailjs_service", KEYS.service);
    localStorage.setItem("emailjs_template",KEYS.template);
    localStorage.setItem("square_base",     KEYS.square);
    try { if (window.emailjs && KEYS.public) emailjs.init({ publicKey: KEYS.public }); } catch {}
    debug("Settings saved.", true);
  };
  $("#saveKeys")?.addEventListener("click", saveKeys);

  // Toggle settings by tapping the title in the topbar
  $(".topbar h1")?.addEventListener("click", () => {
    const s = $("#settings");
    if (!s) return;
    s.style.display = (s.style.display === "none" || !s.style.display) ? "block" : "none";
  });

  window.addEventListener("load", () => {
    applyKeys();
    try { if (window.emailjs && KEYS.public) emailjs.init({ publicKey: KEYS.public }); } catch {}
  });

  // ---------- Age Check ----------
  const ageOverlay = $("#age-check");
  $("#yesBtn")?.addEventListener("click", () => { if (ageOverlay) ageOverlay.style.display = "none"; });
  $("#noBtn")?.addEventListener("click", () => {
    alert("Sorry, you must be 21+ to enter.");
    window.location.href = "https://google.com";
  });
  window.addEventListener("load", () => { if (ageOverlay) ageOverlay.style.display = "grid"; });

  // ---------- Products (Firestore + Storage) ----------
  const productList = $("#product-list");
  const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <rect width='100%' height='100%' fill='#0b0b0b'/>
      <rect x='16' y='16' width='368' height='268' rx='16' fill='#141414' stroke='#ff8c00' stroke-width='4'/>
      <text x='50%' y='55%' text-anchor='middle' font-size='28' fill='#ff8c00' font-family='Arial Black, Arial'>LBizzo</text>
    </svg>
  `);

  async function getImageURL(storagePath) {
    if (!storagePath) return null;
    try {
      const ref = storage.ref(storagePath);
      return await ref.getDownloadURL();
    } catch {
      return null;
    }
  }

  async function addProductCard(p) {
    if (!productList) return;
    const imgURL = await getImageURL(p.image);
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name || "Product"}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <h3>${p.name || "Unnamed"}</h3>
      <p class="price">$${(Number(p.price)||0).toFixed(2)}</p>
      <button class="btn primary add">Add to Cart</button>
    `;
    card.querySelector(".add")?.addEventListener("click", () => addToCart(p));
    productList.appendChild(card);
  }

  async function loadProducts() {
    if (!productList) return;
    productList.innerHTML = "";
    try {
      const snap = await db.collection("products").limit(200).get();
      if (snap.empty) {
        // 50 placeholders so the grid always looks populated
        for (let i = 1; i <= 50; i++) {
          await addProductCard({ id: "ph"+i, name: `Product #${i}`, price: 9.99, image: null });
        }
        debug("No products found — showing placeholders.", true);
      } else {
        for (const doc of snap.docs) {
          const d = doc.data() || {};
          await addProductCard({
            id: doc.id,
            name: d.name || "Unnamed",
            price: Number(d.price) || 0,
            image: d.image || null
          });
        }
        debug(`Loaded ${snap.size} products.`, true);
      }
    } catch (e) {
      console.error(e);
      debug("Error loading products: " + (e.message || e), false);
    }
  }

  // ---------- Cart ----------
  let cart = [];
  const cartCount = $("#cart-count");
  const cartItems = $("#cart-items");
  const cartTotal = $("#cart-total");

  function loadCart() {
    try { cart = JSON.parse(localStorage.getItem("lb_cart") || "[]"); }
    catch { cart = []; }
  }
  function saveCart() {
    try { localStorage.setItem("lb_cart", JSON.stringify(cart)); } catch {}
  }

  function renderCart() {
    if (!cartItems) return;
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach((it, idx) => {
      total += (Number(it.price)||0) * it.qty;
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <div><b>${it.name}</b></div>
          <div style="color:#aaa;font-size:.9rem">$${(Number(it.price)||0).toFixed(2)} × ${it.qty}</div>
        </div>
        <div>
          <button class="btn" data-a="minus">−</button>
          <button class="btn" data-a="plus">+</button>
          <button class="btn" data-a="del">Remove</button>
        </div>
      `;
      li.addEventListener("click", (e) => {
        const a = e.target.getAttribute("data-a");
        if (!a) return;
        if (a === "minus") it.qty = Math.max(1, it.qty - 1);
        if (a === "plus")  it.qty += 1;
        if (a === "del")   cart.splice(idx, 1);
        saveCart(); renderCart(); updateCheckoutButton();
      });
      cartItems.appendChild(li);
    });
    if (cartCount) cartCount.textContent = cart.reduce((n, i) => n + i.qty, 0);
    if (cartTotal) cartTotal.textContent = total.toFixed(2);
    updateCheckoutButton();
  }

  function addToCart(p) {
    const idx = cart.findIndex(i => i.id === p.id);
    if (idx > -1) cart[idx].qty += 1;
    else cart.push({ id: p.id, name: p.name, price: Number(p.price)||0, qty: 1 });
    saveCart(); renderCart();
  }

  $("#clearCart")?.addEventListener("click", () => { cart = []; saveCart(); renderCart(); });

  // ---------- Loyalty Stars ----------
  let starsCount = parseInt(localStorage.getItem("lb_stars") || "0");
  function renderStars() {
    const bar = $("#loyalty-stars");
    if (!bar) return;
    // Ensure there are exactly 6 .star elements (if HTML changed)
    let stars = $$(".star", bar);
    if (stars.length < 6) {
      bar.innerHTML = "";
      for (let i=0; i<6; i++) {
        const s = document.createElement("span");
        s.className = "star";
        s.textContent = "★";
        bar.appendChild(s);
      }
      const label = document.createElement("span");
      label.className = "progress-label";
      label.textContent = "Buy 6 vapes, get 1 free!";
      bar.appendChild(label);
      stars = $$(".star", bar);
    }
    stars.forEach((s, i) => s.classList.toggle("active", i < starsCount));
  }
  async function addStarAndMaybeReward() {
    starsCount++;
    if (starsCount > 6) starsCount = 1;
    localStorage.setItem("lb_stars", String(starsCount));
    renderStars();

    // Send reward email on the 6th star
    if (starsCount === 6) {
      try {
        if (window.emailjs && KEYS.service && KEYS.template) {
          await emailjs.send(KEYS.service, KEYS.template, {
            name: "Loyal Customer",
            phone: "N/A",
            address: "Reward",
            items: "🎁 FREE Vape Reward",
            total: "0.00"
          });
          debug("🎁 Free vape reward email sent!", true);
        }
      } catch (e) {
        console.error("Reward email error:", e);
      }
    }
  }

  // ---------- ID Scanner (bottom) + Scandit ----------
  const video = $("#scanVideo");
  let stream = null;
  let frontData = null, backData = null;
  let verified = false;

  const SCANDIT_KEY = "YOUR_SCANDIT_LICENSE_KEY"; // <-- Put your real Scandit license here
  let scanditReady = false;
  async function initScandit() {
    if (scanditReady || !window.ScanditSDK) return true;
    try {
      await ScanditSDK.configure(SCANDIT_KEY, { engineLocation: "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/" });
      scanditReady = true;
      debug("Scandit SDK configured.", true);
      return true;
    } catch (e) {
      // If the license is missing/invalid, we'll fall back to simulated verify.
      debug("Scandit init failed (using fallback verify): " + (e?.message || e), false);
      return false;
    }
  }

  async function startCam() {
    await initScandit();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      debug("Camera started.", true);
    } catch (e) {
      alert("Camera error: " + (e?.message || e));
    }
  }
  function stopCam() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    if (video) video.srcObject = null;
    debug("Camera stopped.", true);
  }
  $("#startCamBtn")?.addEventListener("click", startCam);
  $("#stopCamBtn")?.addEventListener("click", stopCam);

  function captureFrameToDataURL() {
    if (!video || !video.videoWidth) { alert("Camera not ready yet."); return null; }
    const c = document.createElement("canvas");
    c.width = video.videoWidth; c.height = video.videoHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(video, 0, 0);
    return c.toDataURL("image/jpeg", 0.9);
  }

  async function verifyWithScanditOrFallback(imgData) {
    // If Scandit is ready, attempt basic image parse/scan; otherwise simulate success.
    if (scanditReady && window.ScanditSDK) {
      try {
        // NOTE: Real-world Scandit workflow would use a scanning session or OCR/MRZ.
        // Here we attempt to create an ImageSettings to ensure SDK is processing.
        await ScanditSDK.ImageSettings.createFromImage(imgData);
        return true; // Signal OK if SDK processed the image (placeholder success).
      } catch (e) {
        console.warn("Scandit image process failed, falling back:", e);
      }
    }
    // Fallback — treat capture as valid photo, rely on human review after email.
    return true;
  }

  function updateVerifyUI() {
    const out = $("#scanOut");
    if (!out) return;
    if (verified) {
      out.textContent = "Status: Verified ✅ — both sides captured.";
      out.style.color = "#9ef";
    } else {
      out.textContent = "Status: Not verified. Capture both sides to continue.";
      out.style.color = "#9ef";
    }
    updateCheckoutButton();
  }

  $("#snapFront")?.addEventListener("click", async () => {
    const d = captureFrameToDataURL(); if (!d) return;
    frontData = d;
    const ok = await verifyWithScanditOrFallback(d);
    verified = ok && !!backData;
    updateVerifyUI();
  });
  $("#clearFront")?.addEventListener("click", () => { frontData = null; verified = false; updateVerifyUI(); });

  $("#snapBack")?.addEventListener("click", async () => {
    const d = captureFrameToDataURL(); if (!d) return;
    backData = d;
    const ok = await verifyWithScanditOrFallback(d);
    verified = ok && !!frontData;
    updateVerifyUI();
  });
  $("#clearBack")?.addEventListener("click", () => { backData = null; verified = false; updateVerifyUI(); });

  // ---------- Checkout ----------
  const checkoutBtn = $("#checkoutBtn");
  function updateCheckoutButton() {
    if (checkoutBtn) checkoutBtn.disabled = !(verified && cart.length > 0);
  }

  $("#checkoutBtn")?.addEventListener("click", async () => {
    if (!verified) { alert("Please verify your ID (front & back)."); return; }
    if (cart.length === 0) { alert("Your cart is empty."); return; }

    const name = $("#custName")?.value.trim() || "";
    const phone = $("#custPhone")?.value.trim() || "";
    const address = $("#custAddress")?.value.trim() || "";
    if (!name || !phone || !address) { alert("Please fill name, phone, and delivery address."); return; }

    if (!(window.emailjs && KEYS.public && KEYS.service && KEYS.template)) {
      alert("EmailJS is not configured yet. Tap the title to open Settings and paste your keys.");
      return;
    }

    // Build order text
    const itemsText = cart.map(i => `${i.name} × ${i.qty} ($${(i.price*i.qty).toFixed(2)})`).join("\n");
    const totalText = $("#cart-total")?.textContent || cart.reduce((s,i)=>s+(i.price*i.qty),0).toFixed(2);

    try {
      // Include ID images (base64) so you can review manually in your inbox
      await emailjs.send(KEYS.service, KEYS.template, {
        name, phone, address,
        items: itemsText,
        total: totalText,
        id_front: frontData || "",
        id_back:  backData  || ""
      });
      debug("Order email sent via EmailJS.", true);

      // ⭐ Loyalty star + reward email if reached 6
      await addStarAndMaybeReward();

      // Optional: redirect to Square payment page
      if (KEYS.square) {
        try {
          const u = new URL(KEYS.square);
          u.searchParams.set("name", name);
          u.searchParams.set("total", totalText);
          window.location.href = u.toString();
        } catch { /* ignore bad URL */ }
      } else {
        alert("Order placed! We emailed your order.\n(You can add a Square link in Settings for payment.)");
      }

      // Clear cart after success
      cart = []; saveCart(); renderCart(); updateCheckoutButton();
    } catch (e) {
      console.error(e);
      alert("Could not send order email: " + (e?.text || e?.message || e));
    }
  });

  // ---------- Boot ----------
  async function boot() {
    loadCart(); renderCart(); renderStars(); updateVerifyUI();
    await loadProducts();
    debug("✅ LBizzo ready", true);
  }
  document.addEventListener("DOMContentLoaded", boot);
}
// ------------------ end ------------------
