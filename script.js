// script.js
document.addEventListener("DOMContentLoaded", async () => {
  // ----- guard against double-boot -----
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  console.log("✅ LBizzo Vape Shop running...");

  // ---------- helpers ----------
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const toast = (msg) => {
    console.log(msg);
    const t = $("#toast") || Object.assign(document.body.appendChild(document.createElement("div")), { id: "toast" });
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:16px;padding:10px 14px;background:#111;color:#fff;border:1px solid #ff8c00;border-radius:8px;z-index:9999";
    t.hidden = false;
    clearTimeout(t.__h);
    t.__h = setTimeout(() => (t.hidden = true), 2200);
  };

  // ---------- elements ----------
  const overlay     = $("#age-check");
  const yes         = $("#yesBtn");
  const no          = $("#noBtn");
  const productList = $("#product-list");

  const cartBtn     = $("#cart-btn");
  const cartCount   = $("#cart-count");
  const cartSection = $("#cart");
  const cartItems   = $("#cart-items");
  const totalEl     = $("#total");
  const closeCart   = $("#close-cart");
  const checkoutBtn = $("#checkout-btn");

  // Optional explicit scan UI in HTML; if absent we create it on demand
  let scanSection   = $("#id-scan-section");
  const startScanBtn = $("#start-scan");

  // ---------- AGE VERIFICATION (shows first) ----------
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    const allow = (e) => { e.preventDefault(); overlay.style.display = "none"; };
    const deny  = (e) => { e.preventDefault(); alert("Sorry, you must be 21+ to enter."); location.href = "https://google.com"; };
    ["click","touchstart"].forEach(type => {
      yes.addEventListener(type, allow, { passive: false });
      no.addEventListener(type,  deny,  { passive: false });
    });
  }

  // ---------- FIREBASE (compat) ----------
  // If you already initialized elsewhere, this will no-op.
  if (!firebase.apps?.length) {
    const firebaseConfig = {
      apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
      authDomain: "lbizzodelivery.firebaseapp.com",
      projectId: "lbizzodelivery",
      storageBucket: "lbizzodelivery.firebasestorage.app",
      messagingSenderId: "614540837455",
      appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
      // databaseURL optional
    };
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ---------- PRODUCTS ----------
  const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <rect width='100%' height='100%' fill='#0b0b0b'/>
      <text x='50%' y='52%' fill='#ff8c00' font-family='Arial' font-size='22' text-anchor='middle'>Image coming soon</text>
    </svg>`
  );

  async function getImageURL(pathOrGS) {
    try {
      if (!pathOrGS) return null;
      // Accept "products/xyz.jpg" or gs://bucket/path
      const path = pathOrGS.startsWith("gs://")
        ? pathOrGS.split(".app/")[1] || pathOrGS.split(".com/")[1] || pathOrGS
        : pathOrGS;
      return await storage.ref(path).getDownloadURL();
    } catch (err) {
      console.warn("Image fetch failed:", pathOrGS, err);
      return null;
    }
  }

  async function addCard(p) {
    const priceNum = Number(p.price) || 0;
    let imgURL = p.image ? await getImageURL(p.image) : null;

    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name || "Product"}" onerror="this.src='${PLACEHOLDER_IMG}'"/>
      <h3>${p.name || "Unnamed"}</h3>
      <p>$${priceNum.toFixed(2)}</p>
      <button class="add-btn">Add to Cart</button>
    `;
    const btn = card.querySelector(".add-btn");
    on(btn, "click", () => addToCart({ id: p.id, name: p.name, price: priceNum, image: imgURL || PLACEHOLDER_IMG }));
    productList && productList.appendChild(card);
  }

  async function loadProducts() {
    if (!productList) return;
    productList.innerHTML = "";
    try {
      const snap = await db.collection("products").orderBy("name").limit(100).get();
      if (snap.empty) {
        productList.innerHTML = `<p style="color:#eaeaea">No products found. Add items to Firestore collection <code>products</code> with fields <code>name</code>, <code>price</code>, <code>image</code>.</p>`;
        return;
      }
      for (const doc of snap.docs) {
        await addCard({ id: doc.id, ...doc.data() });
      }
    } catch (e) {
      console.error("loadProducts error", e);
      productList.innerHTML = `<p style="color:#ff6666">Failed to load products.</p>`;
    }
  }

  // ---------- CART ----------
  let cart = JSON.parse(localStorage.getItem("lbizzo_cart") || "[]");
  let idVerified = false;

  function persist() {
    localStorage.setItem("lbizzo_cart", JSON.stringify(cart));
    renderCart();
  }

  function addToCart(item) {
    const found = cart.find(i => i.id === item.id);
    if (found) found.qty += 1;
    else cart.push({ ...item, qty: 1 });
    persist();
    toast("Added to cart");
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    persist();
  }

  function changeQty(id, delta) {
    const it = cart.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(1, it.qty + delta);
    persist();
  }

  function renderCart() {
    if (cartCount) cartCount.textContent = cart.reduce((a,c) => a + c.qty, 0);

    if (!cartItems || !totalEl) return;

    if (cart.length === 0) {
      cartItems.innerHTML = `<li style="color:#aaa">Your cart is empty.</li>`;
      totalEl.textContent = "$0.00";
      return;
    }

    cartItems.innerHTML = "";
    let total = 0;
    for (const it of cart) {
      total += it.price * it.qty;
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="row">
          <img src="${it.image}" alt="${it.name}" />
          <div class="grow">
            <strong>${it.name}</strong>
            <div>$${it.price.toFixed(2)}</div>
            <div class="qty">
              <button class="minus">−</button>
              <span class="q">${it.qty}</span>
              <button class="plus">+</button>
            </div>
          </div>
          <button class="remove">✕</button>
        </div>
      `;
      on(li.querySelector(".minus"), "click", () => changeQty(it.id, -1));
      on(li.querySelector(".plus"),  "click", () => changeQty(it.id, +1));
      on(li.querySelector(".remove"),"click", () => removeFromCart(it.id));
      cartItems.appendChild(li);
    }
    totalEl.textContent = "$" + total.toFixed(2);
  }

  on(cartBtn,   "click", () => cartSection && (cartSection.hidden = false));
  on(closeCart, "click", () => cartSection && (cartSection.hidden = true));

  // ---------- EMAILJS (if present) ----------
  async function sendOrderEmail(payload) {
    if (!window.emailjs || !emailjs.send) {
      console.warn("EmailJS not loaded");
      return { ok:false, error:"EmailJS not loaded" };
    }
    try {
      // Replace with your IDs (or keep if already set in another file)
      const SERVICE_ID  = window.EMAILJS_SERVICE_ID  || "your_service_id";
      const TEMPLATE_ID = window.EMAILJS_TEMPLATE_ID || "your_template_id";
      const PUBLIC_KEY  = window.EMAILJS_PUBLIC_KEY  || "your_public_key";
      emailjs.init(PUBLIC_KEY);
      const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, payload);
      return { ok:true, res };
    } catch (e) {
      console.error("EmailJS send failed", e);
      return { ok:false, error:e?.message || String(e) };
    }
  }

  // ---------- SCANDIT (demo camera) ----------
  // Tries window.SCANDIT_LICENSE first, then <meta name="scandit-key">
  function getScanditKey() {
    if (window.SCANDIT_LICENSE) return window.SCANDIT_LICENSE;
    const meta = document.querySelector('meta[name="scandit-key"]');
    if (meta?.content) return meta.content;
    return null;
  }

  let barcodePicker = null;
  let scanditReady = false;

  async function ensureScanditConfigured() {
    if (scanditReady) return true;
    const key = getScanditKey();
    if (!key) {
      alert("Scandit key missing. Define window.SCANDIT_LICENSE or <meta name=\"scandit-key\" content=\"...\">");
      console.error("❌ No Scandit license key found");
      return false;
    }
    try {
      await ScanditSDK.configure(key, {
        engineLocation: "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/"
      });
      scanditReady = true;
      return true;
    } catch (e) {
      console.error("Scandit configure failed", e);
      alert("Scandit configure failed. Check your license key and HTTPS.");
      return false;
    }
  }

  function parseDOBFromAAMVA(data) {
    // AAMVA has DOB as:
    // - "DBB" (MMDDYYYY) or sometimes "DBBYYYYMMDD" depending on version
    // - Newer versions may use "DBBYYYYMMDD" or "DBBMMDDYYYY"
    // Try both
    let m;
    m = data.match(/DBB(\d{8})/); // grab 8 digits after DBB
    if (m) {
      const raw = m[1];
      // Heuristic: if first 4 look like year >= 1900, assume YYYYMMDD
      const maybeYear = parseInt(raw.slice(0,4), 10);
      let y, mo, d;
      if (maybeYear >= 1900) {
        y = parseInt(raw.slice(0,4),10);
        mo = parseInt(raw.slice(4,6),10);
        d = parseInt(raw.slice(6,8),10);
      } else {
        // Assume MMDDYYYY
        mo = parseInt(raw.slice(0,2),10);
        d  = parseInt(raw.slice(2,4),10);
        y  = parseInt(raw.slice(4,8),10);
      }
      return new Date(y, (mo-1), d);
    }
    // Some jurisdictions use "DBB" with separators or "DBA"/"DBC" variants; add more as needed
    return null;
  }

  function is21(dob) {
    if (!dob || isNaN(dob.getTime())) return false;
    const now = new Date();
    const y = now.getFullYear() - 21;
    const cutoff = new Date(y, now.getMonth(), now.getDate());
    return dob <= cutoff;
  }

  async function startIDScan() {
    if (!(await ensureScanditConfigured())) return;

    // Create a container if none in HTML
    if (!scanSection) {
      scanSection = document.createElement("div");
      scanSection.id = "id-scan-section";
      document.body.appendChild(scanSection);
    }
    scanSection.style.cssText = "position:fixed;inset:0;background:#000a;backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:9999";
    const viewport = document.createElement("div");
    viewport.id = "id-scan-viewport";
    viewport.style.cssText = "width:92vw;height:60vh;background:#000;border:1px solid #ff8c00;border-radius:10px;overflow:hidden;position:relative";
    scanSection.innerHTML = "";
    scanSection.appendChild(viewport);

    try {
      barcodePicker = await ScanditSDK.BarcodePicker.create(viewport, {
        playSoundOnScan: true,
        vibrateOnScan: true
      });
      const scanner = await ScanditSDK.BarcodeScanner.create();
      scanner.applySettings(new ScanditSDK.ScanSettings({
        enabledSymbologies: ["pdf417"],
        codeDuplicateFilter: 1200
      }));

      await barcodePicker.setScanner(scanner);

      // Close button
      const close = document.createElement("button");
      close.textContent = "Close";
      close.style.cssText = "position:absolute;top:10px;right:10px;padding:6px 10px;background:#111;border:1px solid #ff8c00;color:#fff;border-radius:6px";
      close.onclick = () => stopIDScan();
      viewport.appendChild(close);

      barcodePicker.onScan((scanResult) => {
        if (!scanResult?.barcodes?.length) return;
        const code = scanResult.barcodes[0];
        const data = code.data || "";
        // Try parse DOB
        const dob = parseDOBFromAAMVA(data);
        if (dob && !is21(dob)) {
          toast("❌ Must be 21+");
          return; // keep scanning
        }
        idVerified = true;
        if (checkoutBtn) checkoutBtn.disabled = false;
        toast("✅ ID Verified — checkout unlocked");
        stopIDScan();
      });

    } catch (e) {
      console.error("Scandit error", e);
      alert("Camera access failed or Scandit not configured.");
      stopIDScan();
    }
  }

  async function stopIDScan() {
    try {
      if (barcodePicker) {
        await barcodePicker.destroy();
        barcodePicker = null;
      }
      if (scanSection) {
        scanSection.innerHTML = "";
        scanSection.style.display = "none";
      }
    } catch (e) {
      console.warn("stopIDScan cleanup", e);
    }
  }

  // If you have a dedicated "Scan ID" button in HTML
  on(startScanBtn, "click", (e) => {
    e.preventDefault();
    startIDScan();
  });

  // Gate checkout behind ID verification
  if (checkoutBtn) {
    // Start with checkout disabled until verified
    checkoutBtn.disabled = !idVerified;

    on(checkoutBtn, "click", async (e) => {
      if (!idVerified) {
        e.preventDefault();
        toast("Scan your ID to continue");
        await startIDScan();
        return;
      }

      // proceed to your existing checkout flow
      // Example: send order via EmailJS
      const itemsStr = cart.map(i => `${i.name} x${i.qty} — $${(i.price*i.qty).toFixed(2)}`).join("\n");
      const total = cart.reduce((a,c)=>a + c.price*c.qty, 0).toFixed(2);

      const payload = {
        name:  ( $("#cust-name")  && $("#cust-name").value )  || "N/A",
        phone: ( $("#cust-phone") && $("#cust-phone").value ) || "N/A",
        address: ( $("#cust-address") && $("#cust-address").value ) || "N/A",
        items: itemsStr,
        total
      };

      const res = await sendOrderEmail(payload);
      if (res.ok) {
        toast("📧 Order sent!");
        cart = [];
        persist();
        cartSection && (cartSection.hidden = true);
      } else {
        alert("Email failed: " + (res.error || "Unknown error"));
      }
    });
  }

  // ---------- boot ----------
  await loadProducts();
  renderCart();

  console.log("🚀 LBizzo ready");
});I'mm a 
