// ---------- LBizzo Vape Shop - script.js (all-in-one logic) ----------
// Guard against double-boot if the file is accidentally included twice
if (!window.__LBIZZO_BOOTED__) {
  window.__LBIZZO_BOOTED__ = true;

  // ===== Helpers =====
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debugBar = (() => {
    const el = $("#debug");
    return el || null;
  })();
  const debug = (msg, ok = false) => {
    if (!debugBar) return;
    debugBar.textContent = msg;
    debugBar.style.display = "block";
    debugBar.style.background = ok ? "#022" : "#220";
    debugBar.style.color = ok ? "#7fffb3" : "#ff6666";
    // Keep last message visible
  };

  // ===== Firebase (compat) =====
  // Uses your exact config
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.firebasestorage.app",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
  };
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (_) { /* safe if already initialized */ }
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ===== EmailJS (keys saved in localStorage) =====
  const KEYS = {
    public: localStorage.getItem("emailjs_public") || "",
    service: localStorage.getItem("emailjs_service") || "",
    template: localStorage.getItem("emailjs_template") || "",
    square: localStorage.getItem("square_base") || ""
  };

  const applyKeyInputs = () => {
    const p = $("#emailjsPublic"), s = $("#emailjsService"), t = $("#emailjsTemplate"), q = $("#squareBase");
    if (p) p.value = KEYS.public;
    if (s) s.value = KEYS.service;
    if (t) t.value = KEYS.template;
    if (q) q.value = KEYS.square;
  };

  const persistKeys = () => {
    const p = $("#emailjsPublic"), s = $("#emailjsService"), t = $("#emailjsTemplate"), q = $("#squareBase");
    KEYS.public = p ? p.value.trim() : KEYS.public;
    KEYS.service = s ? s.value.trim() : KEYS.service;
    KEYS.template = t ? t.value.trim() : KEYS.template;
    KEYS.square = q ? q.value.trim() : KEYS.square;
    localStorage.setItem("emailjs_public", KEYS.public);
    localStorage.setItem("emailjs_service", KEYS.service);
    localStorage.setItem("emailjs_template", KEYS.template);
    localStorage.setItem("square_base", KEYS.square);
    if (window.emailjs && KEYS.public) {
      try { emailjs.init({ publicKey: KEYS.public }); } catch(_) {}
    }
    debug("Settings saved.", true);
  };

  // Try to init EmailJS on load if key already present
  window.addEventListener("load", () => {
    applyKeyInputs();
    if (window.emailjs && KEYS.public) {
      try { emailjs.init({ publicKey: KEYS.public }); } catch(_) {}
    }
  });

  // Settings UI (optional; guarded)
  const saveKeysBtn = $("#saveKeys");
  if (saveKeysBtn) saveKeysBtn.addEventListener("click", persistKeys);

  const gear = $("#gear");
  if (gear) {
    gear.addEventListener("click", () => {
      const s = $("#settings");
      if (!s) return;
      s.style.display = s.style.display === "block" ? "none" : "block";
    });
  }

  // ===== Age Gate =====
  const ageCheck = $("#age-check");
  const yesBtn = $("#yesBtn");
  const noBtn = $("#noBtn");

  if (yesBtn) {
    yesBtn.addEventListener("click", () => {
      if (ageCheck) ageCheck.style.display = "none";
    });
  }
  if (noBtn) {
    noBtn.addEventListener("click", () => {
      alert("Sorry, you must be 21+ to use this app.");
      try { window.location.href = "https://www.google.com"; } catch(_) {}
    });
  }

  // ===== Live Camera + ID Capture (Front & Back) =====
  // Works standalone. If you later add Scandit SDK, you can hook it in here as well.
  const video = $("#vid");
  const startCamBtn = $("#startCamBtn");
  const stopCamBtn  = $("#stopCamBtn");
  const frontImg = $("#frontImg");
  const backImg  = $("#backImg");
  const snapFront = $("#snapFront");
  const clearFront = $("#clearFront");
  const snapBack  = $("#snapBack");
  const clearBack = $("#clearBack");
  const verifyStatus = $("#verifyStatus");
  const checkoutBtn = $("#checkoutBtn");
  const arrowHint = $(".arrow");

  let stream = null;
  let frontData = null, backData = null;

  const updateVerifyUI = () => {
    const ok = !!frontData && !!backData;
    if (verifyStatus) {
      verifyStatus.innerHTML = ok
        ? 'Status: <b style="color:#7fffb3">Verified</b>. You can checkout.'
        : 'Status: <b>Not verified</b>. Capture both sides to continue.';
    }
    if (checkoutBtn) checkoutBtn.disabled = !ok || cart.length === 0;
    if (arrowHint) arrowHint.classList.toggle("glow", !ok);
  };

  const startCam = async () => {
    if (!video) {
      debug("Camera element not found.", false);
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, audio: false
      });
      video.srcObject = stream;
      if (typeof video.play === "function") video.play();
      debug("Camera started.", true);
    } catch (err) {
      console.error(err);
      debug("Camera error: " + (err.message || err), false);
      alert("Could not access camera. Please allow camera permission.");
    }
  };

  const stopCam = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (video) video.srcObject = null;
    debug("Camera stopped.", true);
  };

  const captureFrame = () => {
    if (!video || !video.videoWidth) {
      alert("Camera not ready yet.");
      return null;
    }
    const c = document.createElement("canvas");
    c.width = video.videoWidth; c.height = video.videoHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(video, 0, 0);
    return c.toDataURL("image/jpeg", 0.85);
  };

  if (startCamBtn) startCamBtn.addEventListener("click", startCam);
  if (stopCamBtn)  stopCamBtn.addEventListener("click", stopCam);

  if (snapFront) snapFront.addEventListener("click", () => {
    const d = captureFrame(); if (!d) return;
    frontData = d; if (frontImg) frontImg.src = d; updateVerifyUI();
  });
  if (clearFront) clearFront.addEventListener("click", () => {
    frontData = null; if (frontImg) frontImg.src = ""; updateVerifyUI();
  });
  if (snapBack) snapBack.addEventListener("click", () => {
    const d = captureFrame(); if (!d) return;
    backData = d; if (backImg) backImg.src = d; updateVerifyUI();
  });
  if (clearBack) clearBack.addEventListener("click", () => {
    backData = null; if (backImg) backImg.src = ""; updateVerifyUI();
  });

  // ===== Products (Firestore) + Placeholders =====
  const productList = $("#product-list");
  const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>
      <rect width='100%' height='100%' fill='#000'/>
      <rect x='32' y='32' width='448' height='448' rx='40' fill='#111' stroke='#ff8c00' stroke-width='8'/>
      <text x='50%' y='54%' font-family='Arial Black, Arial' font-size='60' text-anchor='middle' fill='#ff8c00'>LBizzo</text>
    </svg>
  `);

  async function getImageURL(path) {
    try {
      if (!path) return null;
      const ref = storage.ref(path);
      return await ref.getDownloadURL();
    } catch (_) {
      return null;
    }
  }

  async function addCard(p) {
    if (!productList) return;
    const priceNum = Number(p.price) || 0;
    const card = document.createElement("div");
    card.className = "product";

    let imgURL = null;
    try { imgURL = p.image ? await getImageURL(p.image) : null; } catch(_) {}

    card.innerHTML = `
      <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <div class="p-in">
        <h3>${p.name}</h3>
        <div class="price">$${priceNum.toFixed(2)}</div>
        <button class="add-btn">Add to Cart</button>
      </div>
    `;
    const btn = card.querySelector(".add-btn");
    if (btn) btn.addEventListener("click", () => addToCart(p));
    productList.appendChild(card);
  }

  async function loadProducts() {
    if (!productList) return;
    productList.innerHTML = "";
    try {
      const snap = await db.collection("products").limit(200).get();
      if (snap.empty) {
        const ph = Array.from({ length: 50 }).map((_, i) =>
          ({ id: "ph" + i, name: `Product #${i + 1}`, price: 9.99, image: null })
        );
        for (const p of ph) await addCard(p);
        debug("No products found. Showing 50 placeholders.", true);
      } else {
        const list = [];
        snap.forEach(doc => {
          const d = doc.data() || {};
          list.push({
            id: doc.id,
            name: d.name || "Unnamed",
            price: Number(d.price) || 0,
            image: d.image || null,
            square: d.square || ""
          });
        });
        for (const p of list) await addCard(p);
        debug(`Loaded ${list.length} products from Firestore.`, true);
      }
    } catch (e) {
      console.error(e);
      debug("Error loading products: " + (e.message || e), false);
      // Fallback placeholders so UI stays usable
      const ph = Array.from({ length: 50 }).map((_, i) =>
        ({ id: "ph" + i, name: `Product #${i + 1}`, price: 9.99, image: null })
      );
      for (const p of ph) await addCard(p);
    }
  }

  // ===== Cart =====
  let cart = [];
  const cartCount = $("#cart-count");
  const cartItems = $("#cart-items");
  const cartTotal = $("#cart-total");
  const clearCartBtn = $("#clearCart");

  function saveCart() {
    try { localStorage.setItem("lb_cart", JSON.stringify(cart)); } catch(_) {}
  }
  function loadCart() {
    try { cart = JSON.parse(localStorage.getItem("lb_cart") || "[]"); }
    catch { cart = []; }
  }

  function renderCart() {
    if (cartItems) cartItems.innerHTML = "";
    let total = 0;
    cart.forEach((it, idx) => {
      total += it.price * it.qty;
      if (!cartItems) return;
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <div><b>${it.name}</b></div>
          <div class="small">$${it.price.toFixed(2)} × ${it.qty}</div>
        </div>
        <div class="row">
          <button data-a="minus" class="ghost">−</button>
          <button data-a="plus">+</button>
          <button data-a="del" class="danger">Remove</button>
        </div>
      `;
      li.addEventListener("click", (e) => {
        const a = e.target.getAttribute("data-a");
        if (!a) return;
        if (a === "minus") it.qty = Math.max(1, it.qty - 1);
        if (a === "plus")  it.qty += 1;
        if (a === "del")   cart.splice(idx, 1);
        saveCart(); renderCart();
      });
      cartItems.appendChild(li);
    });

    if (cartCount) cartCount.textContent = cart.reduce((n, i) => n + i.qty, 0);
    if (cartTotal) cartTotal.textContent = total.toFixed(2);
    if (checkoutBtn) checkoutBtn.disabled = !(frontData && backData) || cart.length === 0;
  }

  function addToCart(p) {
    const idx = cart.findIndex(i => i.id === p.id);
    if (idx > -1) cart[idx].qty += 1;
    else cart.push({ id: p.id, name: p.name, price: Number(p.price) || 0, qty: 1 });
    saveCart(); renderCart();
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      cart = [];
      saveCart();
      renderCart();
    });
  }

  // ===== Checkout (requires verified ID) =====
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async () => {
      if (!(frontData && backData)) {
        const idv = $("#id-verify");
        if (idv) window.scrollTo({ top: idv.offsetTop - 10, behavior: "smooth" });
        alert("Please capture FRONT and BACK of your ID first.");
        return;
      }
      if (cart.length === 0) { alert("Your cart is empty."); return; }

      const name = ($("#custName") && $("#custName").value.trim()) || "";
      const phone = ($("#custPhone") && $("#custPhone").value.trim()) || "";
      const address = ($("#custAddress") && $("#custAddress").value.trim()) || "";
      if (!name || !phone || !address) {
        alert("Please enter your name, phone and delivery address.");
        return;
      }

      // Prepare order summary
      const itemsText = cart.map(i => `${i.name} × ${i.qty} ($${(i.price * i.qty).toFixed(2)})`).join("\n");
      const totalText = cartTotal ? cartTotal.textContent : cart.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2);

      // Ensure EmailJS is configured
      if (!(window.emailjs && KEYS.public && KEYS.service && KEYS.template)) {
        alert("EmailJS is not configured yet. Tap ⚙️ and paste your keys, then try again.");
        return;
      }

      try {
        const params = {
          name, phone, address,
          items: itemsText,
          total: totalText,
          id_front: frontData,
          id_back: backData
        };
        await emailjs.send(KEYS.service, KEYS.template, params);
        debug("Order email sent via EmailJS.", true);

        // Optional Square redirect
        if (KEYS.square) {
          try {
            const u = new URL(KEYS.square);
            u.searchParams.set("name", name);
            u.searchParams.set("total", totalText);
            window.location.href = u.toString();
          } catch(_) { /* ignore malformed URL */ }
        } else {
          alert("Order placed! We emailed your order. (Add a Square link in ⚙️ to redirect to payment.)");
        }

        // Clear cart after success
        cart = [];
        saveCart();
        renderCart();
      } catch (err) {
        console.error(err);
        alert("Could not send order email: " + (err?.text || err?.message || err));
      }
    });
  }

  // ===== Boot =====
  async function boot() {
    loadCart();
    renderCart();
    updateVerifyUI();
    await loadProducts();
    debug("✅ LBizzo JS booted.", true);
  }
  document.addEventListener("DOMContentLoaded", boot);
}
// ---------- end script.js ----------
