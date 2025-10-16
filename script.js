document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  console.log("✅ LBizzo Vape Shop running...");

  // ---------- helpers ----------
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const fmt = (n) => Number(n || 0).toFixed(2);
  const sound = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_c3eabf52f8.mp3");
  const toast = (msg) => {
    let t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(t.__h);
    t.__h = setTimeout(() => (t.hidden = true), 1800);
  };

  // ---------- AGE VERIFICATION ----------
  const overlay = $("#age-check");
  const yes = $("#yesBtn");
  const no = $("#noBtn");
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    on(yes, "click", (e) => { e.preventDefault(); overlay.style.display = "none"; });
    on(no,  "click", (e) => { e.preventDefault(); alert("Sorry, you must be 21+ to enter."); location.href = "https://google.com"; });
  }

  // ---------- ELEMENTS ----------
  const productList = $("#product-list");
  const cartBtn     = $("#cart-btn");
  const cartCount   = $("#cart-count");
  const cartSection = $("#cart");
  const cartItems   = $("#cart-items");
  const totalEl     = $("#total");
  const closeCart   = $("#close-cart");
  const checkoutBtn = $("#checkout-btn");
  const scanBtn     = $("#scan-id-btn");
  const starsWrap   = $("#stars");

  // ---------- LOYALTY ----------
  function setStars(n) {
    if (!starsWrap) return;
    const spans = Array.from(starsWrap.children);
    spans.forEach((el, i) => el.classList.toggle("lit", i < n));
  }

  // ---------- FIREBASE HELPERS ----------
  async function getImageURL(path) {
    try {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      return await storage.ref(path).getDownloadURL(); // e.g., "products/name.jpg"
    } catch (err) {
      console.warn("⚠️ Could not load image:", path, err);
      return null;
    }
  }

  // ---------- PRODUCTS ----------
  async function addCard(p) {
    const priceNum = Number(p.price) || 0;
    const imgURL = (await getImageURL(p.image)) || "https://via.placeholder.com/300?text=No+Image";

    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL}" alt="${p.name || "Product"}" />
      <h3>${p.name || "Unnamed"}</h3>
      <p>$${fmt(priceNum)}</p>
      <button class="add-btn">Add to Cart</button>
    `;
    on(card.querySelector(".add-btn"), "click", () => {
      addToCart({ id: p.id, name: p.name, price: priceNum, image: imgURL });
      sound.currentTime = 0; sound.play().catch(()=>{});
      toast("Added to cart");
    });
    productList.appendChild(card);
  }

  async function loadProducts() {
    productList.innerHTML = "";
    const snap = await db.collection("products").orderBy("name").get();
    if (snap.empty) {
      productList.innerHTML = "<p>No products found in Firestore.</p>";
      return;
    }
    for (const doc of snap.docs) await addCard({ id: doc.id, ...doc.data() });
    console.log("🔥 Products loaded.");
  }

  // ---------- CART ----------
  let cart = JSON.parse(localStorage.getItem("lbizzo_cart") || "[]");
  let idVerified = false;

  function persist() {
    localStorage.setItem("lbizzo_cart", JSON.stringify(cart));
    renderCart();
  }

  function addToCart(item) {
    const f = cart.find(i => i.id === item.id);
    if (f) f.qty += 1; else cart.push({ ...item, qty: 1 });
    setStars(Math.min(6, cart.reduce((a,c)=>a+c.qty,0))); // simple star progress
    persist();
  }

  function changeQty(id, delta) {
    const it = cart.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(1, it.qty + delta);
    persist();
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    setStars(Math.min(6, cart.reduce((a,c)=>a+c.qty,0)));
    persist();
  }

  function renderCart() {
    const count = cart.reduce((a,c)=>a+c.qty,0);
    cartCount.textContent = count;

    cartItems.innerHTML = "";
    if (cart.length === 0) {
      cartItems.innerHTML = `<li style="color:#aaa">Your cart is empty.</li>`;
      totalEl.textContent = "0.00";
      return;
    }

    let total = 0;
    for (const it of cart) {
      total += it.price * it.qty;
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${it.image}" alt="${it.name}" />
        <div class="name">
          ${it.name}
          <div class="price">$${fmt(it.price)}</div>
          <div class="qty">
            <button class="minus">−</button>
            <span class="q">${it.qty}</span>
            <button class="plus">+</button>
          </div>
        </div>
        <button class="remove" title="Remove">✕</button>
      `;
      on(li.querySelector(".minus"), "click", () => changeQty(it.id, -1));
      on(li.querySelector(".plus"),  "click", () => changeQty(it.id, +1));
      on(li.querySelector(".remove"),"click", () => removeFromCart(it.id));
      cartItems.appendChild(li);
    }
    totalEl.textContent = fmt(total);
  }

  on(cartBtn,   "click", () => (cartSection.classList.remove("hidden")));
  on(closeCart, "click", () => (cartSection.classList.add("hidden")));

  // ---------- SCANDIT ----------
  function getScanditKey() {
    if (window.SCANDIT_LICENSE) return window.SCANDIT_LICENSE;
    const meta = document.querySelector('meta[name="scandit-key"]');
    return meta?.content || null;
  }

  let picker = null;
  async function startIDScan() {
    const key = getScanditKey();
    if (!key) { alert("Scandit license key missing."); return; }

    try {
      await ScanditSDK.configure(key, { engineLocation: "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/" });
    } catch (e) {
      console.error("Scandit configure error", e); alert("Scandit configure failed."); return;
    }

    // Build overlay
    let scanLayer = document.getElementById("id-scan-layer");
    if (!scanLayer) {
      scanLayer = document.createElement("div");
      scanLayer.id = "id-scan-layer";
      scanLayer.style.cssText = "position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:9500";
      document.body.appendChild(scanLayer);
    }
    const viewport = document.createElement("div");
    viewport.style.cssText = "width:92vw;height:60vh;background:#000;border:1px solid #ff8c00;border-radius:10px;overflow:hidden;position:relative";
    scanLayer.innerHTML = ""; scanLayer.appendChild(viewport);

    // close button
    const close = document.createElement("button");
    close.textContent = "Close";
    close.style.cssText = "position:absolute;top:10px;right:10px;padding:6px 10px;background:#111;border:1px solid #ff8c00;color:#fff;border-radius:6px;z-index:2";
    close.onclick = stopIDScan;
    viewport.appendChild(close);

    try {
      picker = await ScanditSDK.BarcodePicker.create(viewport, { playSoundOnScan: true, vibrateOnScan: true });
      const scanner = await ScanditSDK.BarcodeScanner.create();
      await scanner.applySettings(new ScanditSDK.ScanSettings({ enabledSymbologies: ["pdf417"], codeDuplicateFilter: 1200 }));
      await picker.setScanner(scanner);

      picker.onScan((res) => {
        const code = res?.barcodes?.[0];
        const data = code?.data || "";
        // attempt to parse AAMVA DOB (DBB)
        const m = data.match(/DBB(\d{8})/); // 8 digits after DBB
        let ok = false;
        if (m) {
          const raw = m[1];
          let y, mo, d;
          if (parseInt(raw.slice(0,4),10) >= 1900) {
            y = +raw.slice(0,4); mo = +raw.slice(4,6); d = +raw.slice(6,8);
          } else {
            mo = +raw.slice(0,2); d = +raw.slice(2,4); y = +raw.slice(4,8);
          }
          const dob = new Date(y, mo-1, d);
          const now = new Date();
          const cutoff = new Date(now.getFullYear()-21, now.getMonth(), now.getDate());
          ok = dob <= cutoff;
        }
        if (!ok) { toast("❌ Must be 21+"); return; }
        idVerified = true;
        checkoutBtn.disabled = false;
        toast("✅ ID Verified — checkout unlocked");
        stopIDScan();
      });
    } catch (e) {
      console.error("Scan error", e);
      alert("Camera permission or scanner failure.");
      stopIDScan();
    }
  }

  function stopIDScan() {
    try { picker && picker.destroy(); } catch {}
    picker = null;
    const layer = document.getElementById("id-scan-layer");
    if (layer) layer.remove();
  }

  on(scanBtn, "click", (e) => { e.preventDefault(); startIDScan(); });

  // ---------- EMAILJS ----------
  // Set your keys here or define window.EMAILJS_* before this runs
  const EMAILJS_SERVICE_ID  = window.EMAILJS_SERVICE_ID  || "YOUR_SERVICE_ID";
  const EMAILJS_TEMPLATE_ID = window.EMAILJS_TEMPLATE_ID || "YOUR_TEMPLATE_ID";
  const EMAILJS_PUBLIC_KEY  = window.EMAILJS_PUBLIC_KEY  || "YOUR_PUBLIC_KEY";

  function emailEnabled() {
    return window.emailjs && EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID";
  }

  async function sendOrderEmail(payload) {
    try {
      if (!emailEnabled()) throw new Error("EmailJS not configured");
      emailjs.init(EMAILJS_PUBLIC_KEY);
      const res = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
      return res;
    } catch (e) {
      console.error("EmailJS error", e);
      throw e;
    }
  }

  on(checkoutBtn, "click", async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!idVerified) { toast("Scan your ID to continue"); return; }

    const itemsStr = cart.map(i => `${i.name} x${i.qty} — $${fmt(i.price*i.qty)}`).join("\n");
    const total = cart.reduce((a,c)=>a + c.price*c.qty, 0);

    const payload = {
      name:    $("#cust-name")?.value || "N/A",
      phone:   $("#cust-phone")?.value || "N/A",
      address: $("#cust-address")?.value || "N/A",
      items:   itemsStr,
      total:   fmt(total)
    };

    try {
      await sendOrderEmail(payload);
      toast("📧 Order sent!");
      cart = [];
      persist();
      cartSection.classList.add("hidden");
    } catch (err) {
      alert("❌ Failed to send order. Check your EmailJS keys.");
    }
  });

  // ---------- BOOT ----------
  await loadProducts();
  renderCart();
  setStars(Math.min(6, cart.reduce((a,c)=>a+c.qty,0)));
  console.log("🚀 LBizzo ready");
});
