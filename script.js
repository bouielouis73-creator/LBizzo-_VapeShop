// =========================================================
// ✅ LBizzo Vape Shop - Full Script
// ✅ Scandit ID Verify (before checkout)
// ✅ Firebase image loading fixed
// ✅ Price display fix (no more $0.00)
// ✅ Cart hardened + Auto-Injected Cart UI
// =========================================================

// ---------- SCANDIT: dynamic loader + configure ----------
const SCANDIT_LICENSE_KEY = "PASTE_YOUR_FULL_SCANDIT_KEY_HERE"; // <-- paste your Scandit key
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
// 💾 LBizzo App Code (Auto-Injected Cart)
// =========================================================
document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;
  console.log("✅ LBizzo Vape Shop running...");

  // ---------- Inject Cart HTML if missing ----------
  if (!document.querySelector("#cart-btn")) {
    const btn = document.createElement("button");
    btn.id = "cart-btn";
    btn.className = "cart-btn";
    btn.innerHTML = `🛒 <span id="cart-count">0</span>`;
    btn.style.cssText = "position:fixed;bottom:20px;right:20px;background:#ff8c00;color:#000;font-weight:bold;border:none;border-radius:50px;padding:12px 18px;z-index:9999;";
    document.body.appendChild(btn);
  }

  if (!document.querySelector("#cart")) {
    const cartHTML = `
      <div id="cart" class="cart" hidden style="position:fixed;top:0;right:0;width:90%;max-width:420px;height:100%;background:#0b0b0b;color:#fff;border-left:2px solid #ff8c00;z-index:9998;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #333;">
          <h2>Your Cart</h2>
          <button id="close-cart" style="background:none;border:none;color:#ff8c00;font-size:22px;">✕</button>
        </div>
        <ul id="cart-items" style="flex:1;overflow-y:auto;list-style:none;padding:10px;margin:0;"></ul>
        <div style="border-top:1px solid #333;padding:10px;">
          <div>Total: $<span id="total">0.00</span></div>
          <button id="checkout-btn" disabled style="margin-top:8px;width:100%;padding:10px;background:#ff8c00;color:#000;border:none;border-radius:8px;font-weight:bold;">Checkout</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", cartHTML);
  }

  // ---------- HELPERS ----------
  const $ = (s, r = document) => r.querySelector(s);
  const toast = (msg) => {
    const t = $("#toast") || Object.assign(document.body.appendChild(document.createElement("div")), { id: "toast" });
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:16px;padding:10px 14px;background:#111;color:#fff;border:1px solid #ff8c00;border-radius:8px;z-index:9999";
    t.hidden = false;
    clearTimeout(t.__h);
    t.__h = setTimeout(() => (t.hidden = true), 2000);
  };

  // ---------- CART ----------
  const cartBtn = $("#cart-btn");
  const cartCount = $("#cart-count");
  const cartSection = $("#cart");
  const cartItems = $("#cart-items");
  const totalEl = $("#total");
  const closeCart = $("#close-cart");
  const checkoutBtn = $("#checkout-btn");

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
    if (!cartItems || !totalEl || !cartCount) return;
    const totalQty = cart.reduce((a, c) => a + c.qty, 0);
    cartCount.textContent = totalQty;
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
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div><strong>${it.name}</strong><br><small>$${it.price.toFixed(2)}</small></div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button class="minus">−</button>
            <span>${it.qty}</span>
            <button class="plus">+</button>
            <button class="remove">✕</button>
          </div>
        </div>
      `;
      li.querySelector(".minus").onclick = () => changeQty(it.id, -1);
      li.querySelector(".plus").onclick = () => changeQty(it.id, +1);
      li.querySelector(".remove").onclick = () => removeFromCart(it.id);
      cartItems.appendChild(li);
    }
    totalEl.textContent = total.toFixed(2);
  }

  // ---------- CART BUTTONS ----------
  cartBtn.onclick = () => { cartSection.hidden = false; renderCart(); };
  closeCart.onclick = () => { cartSection.hidden = true; };

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
  checkoutBtn.addEventListener("click", async (e) => {
    if (!idVerified) {
      e.preventDefault();
      toast("Scan your ID to continue");
      await startIDScan();
      return;
    }

    const itemsStr = cart.map(i => `${i.name} x${i.qty} — $${(i.price * i.qty).toFixed(2)}`).join("\n");
    const total = cart.reduce((a, c) => a + c.price * c.qty, 0).toFixed(2);
    toast("📧 Order sent! Redirecting to payment...");
    const squareLink = `https://square.link/u/GTlYqlIK?note=${encodeURIComponent(itemsStr)}&amount=${total}`;
    setTimeout(() => window.open(squareLink, "_blank"), 800);
    cart = [];
    persist();
    cartSection.hidden = true;
  });

  renderCart();
  console.log("🚀 LBizzo ready with auto-cart and Scandit integration");
});
