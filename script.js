// =========================================================
// LBizzo Vape Shop - Full Script (Cart fixed + Firebase + Scandit + EmailJS + Square)
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  // ---------- HELPERS ----------
  const $ = (s, r = document) => r.querySelector(s);
  const toast = (msg) => {
    const t = $("#toast") || Object.assign(document.body.appendChild(document.createElement("div")), { id: "toast" });
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:16px;padding:10px 14px;background:#111;color:#fff;border:1px solid #ff8c00;border-radius:8px;z-index:99999";
    t.hidden = false; clearTimeout(t.__h); t.__h = setTimeout(() => (t.hidden = true), 1800);
  };

  // ---------- ELEMENTS ----------
  const overlay = $("#age-check");
  const yes = $("#yesBtn");
  const no = $("#noBtn");
  const productList = $("#product-list");
  const cartBtn = $("#cart-btn");
  const cartCount = $("#cart-count");
  const cartSection = $("#cart");
  const cartItems = $("#cart-items");
  const totalEl = $("#total");
  const closeCart = $("#close-cart");
  const checkoutBtn = $("#checkout-btn");
  const scanIdBtn = $("#scan-id-btn");

  // ---------- AGE GATE ----------
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    yes.addEventListener("click", (e) => { e.preventDefault(); overlay.style.display = "none"; });
    no.addEventListener("click", (e) => { e.preventDefault(); alert("Sorry, you must be 21+ to enter."); location.href = "https://google.com"; });
  }

  // ---------- FIREBASE ----------
  const db = firebase.firestore();
  const storage = firebase.storage();

  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
        <rect width='100%' height='100%' fill='#0b0b0b'/>
        <text x='50%' y='52%' fill='#ff8c00' font-family='Arial' font-size='22' text-anchor='middle'>Image coming soon</text>
      </svg>`
    );

  async function getImageURL(path) {
    try {
      if (!path) return PLACEHOLDER_IMG;

      // Support gs://lbizzodelivery.appspot.com/products/xxx.jpg and plain "products/xxx.jpg"
      if (path.startsWith("gs://")) {
        const clean = path.split(".appspot.com/")[1]; // -> products/xxx.jpg
        return await storage.ref(clean).getDownloadURL();
      }
      if (path.startsWith("http")) return path; // already a URL
      // default: relative path inside Storage (e.g., "products/xxx.jpg")
      return await storage.ref(path).getDownloadURL();
    } catch (err) {
      console.warn("Image fetch failed:", path, err?.message || err);
      return PLACEHOLDER_IMG;
    }
  }

  // ---------- PRODUCTS ----------
  async function addCard(p) {
    let priceNum = typeof p.price === "number" ? p.price : parseFloat(p.price);
    if (isNaN(priceNum) || priceNum <= 0) priceNum = 0;
    const imgURL = await getImageURL(p.image || (p.path && `products/${p.path}`));

    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL}" alt="${p.name || "Product"}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <h3>${p.name || "Unnamed"}</h3>
      ${priceNum > 0 ? `<p>$${priceNum.toFixed(2)}</p>` : `<p style="color:#ff8c00;">Contact for Price</p>`}
      <button class="add-btn" ${priceNum <= 0 ? "disabled" : ""}>
        ${priceNum <= 0 ? "Unavailable" : "Add to Cart"}
      </button>
    `;
    if (priceNum > 0) {
      card.querySelector(".add-btn").onclick = () =>
        addToCart({ id: p.id, name: p.name, price: priceNum, image: imgURL });
    }
    productList.appendChild(card);
  }

  async function loadProducts() {
    productList.innerHTML = "";
    const snap = await db.collection("products").orderBy("name").limit(100).get();
    if (snap.empty) {
      productList.innerHTML = `<p style="color:#eaeaea">No products found.</p>`;
      return;
    }
    for (const doc of snap.docs) await addCard({ id: doc.id, ...doc.data() });
    console.log("✅ Firebase products loaded");
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
    toast(`${item.name} added to cart 🛒`);
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
    if (!cartItems || !totalEl || !cartCount) return;
    const totalQty = cart.reduce((a, c) => a + c.qty, 0);
    cartCount.textContent = String(totalQty);

    if (cart.length === 0) {
      cartItems.innerHTML = `<li style="color:#aaa">Your cart is empty.</li>`;
      totalEl.textContent = "0.00";
      checkoutBtn && (checkoutBtn.disabled = true);
      return;
    }

    cartItems.innerHTML = "";
    let total = 0;
    for (const it of cart) {
      total += (Number(it.price) || 0) * (Number(it.qty) || 0);
      const li = document.createElement("li");
      li.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${it.image}" alt="${it.name}" />
            <div><strong>${it.name}</strong><br><small>$${(Number(it.price)||0).toFixed(2)}</small></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button class="minus">−</button>
            <span>${Number(it.qty)||1}</span>
            <button class="plus">+</button>
            <button class="remove">✕</button>
          </div>
        </div>`;
      li.querySelector(".minus").onclick = () => changeQty(it.id, -1);
      li.querySelector(".plus").onclick  = () => changeQty(it.id, +1);
      li.querySelector(".remove").onclick = () => removeFromCart(it.id);
      cartItems.appendChild(li);
    }
    totalEl.textContent = total.toFixed(2);
    checkoutBtn && (checkoutBtn.disabled = !idVerified);
  }

  // ---------- CART BUTTON (iOS-safe; class toggle) ----------
  function openCart() {
    if (!cartSection) return;
    renderCart();
    cartSection.classList.add("active");
    cartBtn && cartBtn.setAttribute("aria-expanded", "true");
    try { new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_9d3f7a4c25.mp3?filename=click-124467.mp3").play(); } catch {}
  }
  function closeCartPanel() {
    if (!cartSection) return;
    cartSection.classList.remove("active");
    cartBtn && cartBtn.setAttribute("aria-expanded", "false");
  }
  if (cartBtn) {
    const handler = (e) => { e.preventDefault(); e.stopPropagation(); openCart(); };
    ["click","touchend","pointerup"].forEach(ev => cartBtn.addEventListener(ev, handler, { passive:false }));
    cartBtn.style.cursor = "pointer";
  }
  if (closeCart) {
    ["click","touchend"].forEach(ev => closeCart.addEventListener(ev, (e)=>{ e.preventDefault(); closeCartPanel(); }, { passive:false }));
  }

  // ---------- EMAILJS ----------
  async function sendOrderEmail(payload) {
    if (!window.emailjs || !emailjs.send) return { ok:false, error:"EmailJS not loaded" };
    try {
      emailjs.init(window.EMAILJS_PUBLIC_KEY || "jUx6gEqKl1tvL7yLs");
      const res = await emailjs.send(
        window.EMAILJS_SERVICE_ID || "service_7o2u4kq",
        window.EMAILJS_TEMPLATE_ID || "template_6jlkofi",
        payload
      );
      return { ok:true, res };
    } catch (e) {
      return { ok:false, error:e.message };
    }
  }

  // ---------- SCANDIT (ID Scan inside the cart) ----------
  const SCANDIT_LICENSE_KEY =
    window.SCANDIT_LICENSE_KEY ||
    document.querySelector('meta[name="scandit-key"]')?.content ||
    "PASTE_YOUR_SCANDIT_KEY_HERE";

  let __scanOverlay, __scanContainer, __scanPicker;

  function ensureIDScanUI() {
    if (__scanOverlay) return;
    __scanOverlay = document.createElement("div");
    __scanOverlay.style.cssText = "position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.9);display:none;align-items:center;justify-content:center;padding:16px;";
    const box = document.createElement("div");
    box.style.cssText = "width:min(92vw,520px);background:#0b0b0b;border:1px solid #ff8c00;border-radius:14px;padding:16px;color:#eaeaea;text-align:center;";
    box.innerHTML = `
      <h2 style="margin:0 0 8px;color:#ff8c00;">Verify Your ID</h2>
      <p style="margin:0 0 10px;color:#ccc;">Scan the barcode on the back of your driver's license.</p>
      <div id="lbizzo-scan-cam" style="width:100%;max-width:460px;margin:10px auto;"></div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
        <button id="lbizzo-scan-start" style="padding:10px 14px;border:1px solid #ff8c00;background:#111;color:#fff;border-radius:10px;">Start Scan</button>
        <button id="lbizzo-scan-cancel" style="padding:10px 14px;border:1px solid #444;background:#111;color:#ccc;border-radius:10px;">Cancel</button>
      </div>`;
    __scanContainer = box.querySelector("#lbizzo-scan-cam");
    __scanOverlay.appendChild(box);
    document.body.appendChild(__scanOverlay);
  }

  async function ensureScanditConfigured() {
    if (window.__scanditReady) return true;
    await ScanditSDK.configure(SCANDIT_LICENSE_KEY, {
      engineLocation: "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/"
    });
    window.__scanditReady = true;
    return true;
  }

  function openScanModal(onVerified) {
    ensureIDScanUI();
    __scanOverlay.style.display = "flex";
    const startBtn = __scanOverlay.querySelector("#lbizzo-scan-start");
    const cancelBtn = __scanOverlay.querySelector("#lbizzo-scan-cancel");

    startBtn.onclick = async () => {
      try {
        await ensureScanditConfigured();
        if (__scanPicker) { await __scanPicker.destroy(); __scanPicker = null; }
        __scanPicker = await ScanditSDK.BarcodePicker.create(__scanContainer, {
          playSoundOnScan: true, vibrateOnScan: true,
        });
        const settings = new ScanditSDK.ScanSettings({
          enabledSymbologies: ["pdf417"],
          codeDuplicateFilter: 1000
        });
        __scanPicker.applyScanSettings(settings);
        __scanPicker.on("scan", (result) => {
          if (result?.barcodes?.length) {
            toast("✅ ID Verified");
            idVerified = true;
            checkoutBtn && (checkoutBtn.disabled = false);
            closeScanModal();
            onVerified && onVerified();
          }
        });
      } catch (err) {
        console.error("Scandit error:", err);
        toast("Camera error. Check permissions.");
      }
    };

    cancelBtn.onclick = closeScanModal;
  }

  async function closeScanModal() {
    if (__scanPicker) {
      try { await __scanPicker.destroy(); } catch {}
      __scanPicker = null;
    }
    if (__scanOverlay) __scanOverlay.style.display = "none";
  }

  // Hook Scan ID button
  if (scanIdBtn) {
    ["click","touchend"].forEach(ev => scanIdBtn.addEventListener(ev, (e)=>{ e.preventDefault(); openScanModal(); }, { passive:false }));
  }

  // ---------- CHECKOUT ----------
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      if (!cart.length) {
        toast("🛒 Your cart is empty");
        return;
      }

      if (!idVerified) {
        toast("🔒 Please scan your ID first");
        openScanModal(() => {}); // user scans, then taps Checkout again
        return;
      }

      const itemsStr = cart.map(i => `${i.name} x${i.qty} — $${(i.price * i.qty).toFixed(2)}`).join("\n");
      const total = cart.reduce((a, c) => a + c.price * c.qty, 0).toFixed(2);
      const payload = {
        name: ($("#cust-name")?.value) || "N/A",
        phone: ($("#cust-phone")?.value) || "N/A",
        address: ($("#cust-address")?.value) || "N/A",
        items: itemsStr,
        total
      };

      const res = await sendOrderEmail(payload);
      if (res.ok) {
        toast("📧 Order sent! Redirecting to Square…");
        const squareLink = `https://square.link/u/GTlYqlIK?note=${encodeURIComponent(itemsStr)}&amount=${total}`;
        setTimeout(() => window.open(squareLink, "_blank"), 800);
        cart = []; persist(); closeCartPanel();
      } else {
        alert("Email failed: " + (res.error || "Unknown error"));
      }
    });
  }

  // ---------- INIT ----------
  await loadProducts();
  renderCart();
  console.log("🚀 LBizzo ready: Cart fixed + Firebase + Scandit + EmailJS + Square");
});
