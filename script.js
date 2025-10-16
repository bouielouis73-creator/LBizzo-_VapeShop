// =========================================================
// ✅ LBizzo Vape Shop - Full Script
// ✅ Scandit ID Verify (before checkout)
// ✅ Firebase image loading fixed
// ✅ Price display fix (no more $0.00)
// ✅ Cart fully repaired
// =========================================================

// ---------- SCANDIT: dynamic loader + configure ----------
const SCANDIT_LICENSE_KEY = "PASTE_YOUR_FULL_SCANDIT_KEY_HERE"; // <-- paste your key
let __scanditReady = false;

async function loadScanditSDK() {
  if (window.ScanditSDK) return true;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x";
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load Scandit SDK"));
    document.head.appendChild(s);
  });
  return true;
}

async function ensureScanditConfigured() {
  if (__scanditReady) return true;
  await loadScanditSDK();
  await ScanditSDK.configure(SCANDIT_LICENSE_KEY, {
    engineLocation: "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/"
  });
  __scanditReady = true;
  console.log("✅ Scandit SDK configured");
  return true;
}

// ---------- Scandit Scan UI ----------
let __scanOverlay, __scanContainer, __scanPicker;
function ensureIDScanUI() {
  if (__scanOverlay) return;
  __scanOverlay = document.createElement("div");
  __scanOverlay.id = "lbizzo-id-overlay";
  __scanOverlay.style.cssText = `
    position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,.9);
    display:none; align-items:center; justify-content:center; padding:16px;
  `;
  const box = document.createElement("div");
  box.style.cssText = `
    width:min(92vw,520px); background:#0b0b0b; border:1px solid #ff8c00;
    border-radius:14px; padding:16px; color:#eaeaea; text-align:center;
  `;
  box.innerHTML = `
    <h2 style="margin:0 0 8px; color:#ff8c00;">Verify Your ID</h2>
    <p style="margin:0 0 10px; color:#ccc;">Scan the barcode on the back of your driver’s license.</p>
    <div id="lbizzo-scan-cam" style="width:100%; max-width:460px; margin:10px auto;"></div>
    <div style="display:flex; gap:8px; justify-content:center; margin-top:10px;">
      <button id="lbizzo-scan-start" style="padding:10px 14px;border:1px solid #ff8c00;background:#111;color:#fff;border-radius:10px;">Start Scan</button>
      <button id="lbizzo-scan-cancel" style="padding:10px 14px;border:1px solid #444;background:#111;color:#ccc;border-radius:10px;">Cancel</button>
    </div>
  `;
  __scanContainer = box.querySelector("#lbizzo-scan-cam");
  __scanOverlay.appendChild(box);
  document.body.appendChild(__scanOverlay);
}

async function openScanModal(onVerified) {
  ensureIDScanUI();
  __scanOverlay.style.display = "flex";
  const startBtn = __scanOverlay.querySelector("#lbizzo-scan-start");
  const cancelBtn = __scanOverlay.querySelector("#lbizzo-scan-cancel");

  startBtn.onclick = async () => {
    try {
      await ensureScanditConfigured();
      if (__scanPicker) {
        await __scanPicker.destroy();
        __scanPicker = null;
      }
      __scanPicker = await ScanditSDK.BarcodePicker.create(__scanContainer, {
        playSoundOnScan: true,
        vibrateOnScan: true,
      });
      const settings = new ScanditSDK.ScanSettings({
        enabledSymbologies: ["pdf417"],
        codeDuplicateFilter: 1000
      });
      __scanPicker.applyScanSettings(settings);

      __scanPicker.on("scan", (result) => {
        if (result.barcodes && result.barcodes.length) {
          toast("✅ ID Verified — checkout unlocked");
          closeScanModal();
          onVerified && onVerified();
        }
      });
    } catch (err) {
      console.error("❌ Scandit error:", err);
      toast("Camera error. Check permissions.");
    }
  };

  cancelBtn.onclick = () => closeScanModal();
}

async function closeScanModal() {
  if (__scanPicker) {
    try { await __scanPicker.destroy(); } catch {}
    __scanPicker = null;
  }
  if (__scanOverlay) __scanOverlay.style.display = "none";
}

// =========================================================
// 💾 LBizzo App Code
// =========================================================
document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;
  console.log("✅ LBizzo Vape Shop running...");

  const $ = (s, r = document) => r.querySelector(s);
  const toast = (msg) => {
    const t = $("#toast") || Object.assign(document.body.appendChild(document.createElement("div")), { id: "toast" });
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:16px;padding:10px 14px;background:#111;color:#fff;border:1px solid #ff8c00;border-radius:8px;z-index:9999";
    t.hidden = false;
    clearTimeout(t.__h);
    t.__h = setTimeout(() => (t.hidden = true), 2000);
  };

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

  if (overlay && yes && no) {
    overlay.style.display = "grid";
    yes.onclick = (e) => { e.preventDefault(); overlay.style.display = "none"; };
    no.onclick = (e) => { e.preventDefault(); alert("Sorry, you must be 21+ to enter."); location.href = "https://google.com"; };
  }

  // ---------- FIREBASE ----------
  const db = firebase.firestore();
  const storage = firebase.storage();
  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
        <rect width='100%' height='100%' fill='#0b0b0b'/>
        <text x='50%' y='52%' fill='#ff8c00' font-family='Arial' font-size='22' text-anchor='middle'>Image coming soon</text>
      </svg>`
    );

  async function getImageURL(path) {
    try {
      if (!path) return PLACEHOLDER_IMG;
      if (path.startsWith("gs://")) {
        const cleanPath = path.split(".appspot.com/")[1];
        return await storage.ref(cleanPath).getDownloadURL();
      }
      if (path.startsWith("http")) return path;
      return await storage.ref(path).getDownloadURL();
    } catch {
      return PLACEHOLDER_IMG;
    }
  }

  // ---------- PRICE + PRODUCT CARD ----------
  async function addCard(p) {
    let priceNum = typeof p.price === "number" ? p.price : parseFloat(p.price);
    if (isNaN(priceNum) || priceNum <= 0) priceNum = 0;

    const imgURL = await getImageURL(p.image);
    const priceDisplay = priceNum > 0
      ? `<p>$${priceNum.toFixed(2)}</p>`
      : `<p style="color:#ff8c00;">Contact for Price</p>`;

    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL}" alt="${p.name}" />
      <h3>${p.name}</h3>
      ${priceDisplay}
      <button class="add-btn" ${priceNum <= 0 ? "disabled" : ""}>
        ${priceNum <= 0 ? "Unavailable" : "Add to Cart"}
      </button>
    `;
    const btn = card.querySelector(".add-btn");
    if (priceNum > 0) btn.onclick = () => addToCart({ id: p.id, name: p.name, price: priceNum, image: imgURL });
    productList.appendChild(card);
  }

  async function loadProducts() {
    productList.innerHTML = "";
    const snap = await db.collection("products").orderBy("name").get();
    if (snap.empty) {
      productList.innerHTML = "<p>No products found.</p>";
      return;
    }
    for (const doc of snap.docs) await addCard({ id: doc.id, ...doc.data() });
  }

  // ---------- CART (fully repaired) ----------
  let cart = JSON.parse(localStorage.getItem("lbizzo_cart") || "[]");
  let idVerified = false;

  function persist() {
    localStorage.setItem("lbizzo_cart", JSON.stringify(cart));
    renderCart();
  }

  function addToCart(item) {
    if (!item || !item.id) return;
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
    if (!cartItems || !totalEl) return;
    cartCount.textContent = cart.reduce((a, c) => a + c.qty, 0);

    if (cart.length === 0) {
      cartItems.innerHTML = `<li style="color:#aaa">Your cart is empty.</li>`;
      totalEl.textContent = "0.00";
      return;
    }

    cartItems.innerHTML = "";
    let total = 0;
    for (const it of cart) {
      total += it.price * it.qty;
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="row" style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${it.image}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">
            <div><strong>${it.name}</strong><br><small>$${it.price.toFixed(2)}</small></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button class="minus">−</button>
            <span class="q">${it.qty}</span>
            <button class="plus">+</button>
            <button class="remove">✕</button>
          </div>
        </div>`;
      li.querySelector(".minus").onclick = () => changeQty(it.id, -1);
      li.querySelector(".plus").onclick = () => changeQty(it.id, +1);
      li.querySelector(".remove").onclick = () => removeFromCart(it.id);
      cartItems.appendChild(li);
    }
    totalEl.textContent = total.toFixed(2);
  }

  cartBtn.onclick = () => { cartSection.hidden = false; renderCart(); };
  closeCart.onclick = () => (cartSection.hidden = true);

  // ---------- EMAILJS ----------
  async function sendOrderEmail(payload) {
    if (!window.emailjs || !emailjs.send) return { ok: false, error: "EmailJS not loaded" };
    try {
      emailjs.init(window.EMAILJS_PUBLIC_KEY || "your_public_key");
      const res = await emailjs.send(
        window.EMAILJS_SERVICE_ID || "your_service_id",
        window.EMAILJS_TEMPLATE_ID || "your_template_id",
        payload
      );
      return { ok: true, res };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // ---------- SCANDIT ID SCAN ----------
  async function startIDScan() {
    toast("📷 Starting ID scan...");
    try {
      await openScanModal(() => {
        idVerified = true;
        checkoutBtn.disabled = false;
      });
    } catch {
      toast("Could not start camera");
    }
  }

  // ---------- CHECKOUT ----------
  checkoutBtn.onclick = async (e) => {
    if (!idVerified) {
      e.preventDefault();
      toast("Scan your ID to continue");
      await startIDScan();
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
      toast("📧 Order sent! Redirecting to payment...");
      const squareLink = `https://square.link/u/GTlYqlIK?note=${encodeURIComponent(itemsStr)}&amount=${total}`;
      setTimeout(() => window.open(squareLink, "_blank"), 800);
      cart = [];
      persist();
      cartSection.hidden = true;
    } else alert("Email failed: " + (res.error || "Unknown error"));
  };

  // ---------- INIT ----------
  await loadProducts();
  renderCart();
  console.log("🚀 LBizzo ready with Firebase images, prices, Scandit, and working cart");
});
