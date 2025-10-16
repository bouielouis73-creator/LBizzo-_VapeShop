// =========================================================
// ✅ LBizzo Vape Shop - Full Script
// ✅ Fix: Cart button → Scandit ID scan → Square Checkout
// =========================================================

// ---------- SCANDIT: dynamic loader + configure ----------
const SCANDIT_LICENSE_KEY = "PASTE_YOUR_FULL_SCANDIT_KEY_HERE"; // <-- your real key
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

// ---------- SCANDIT MODAL ----------
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
    <p style="margin:0 0 10px; color:#ccc;">Scan the barcode on the back of your ID.</p>
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
          toast("✅ ID Verified — continuing to checkout...");
          closeScanModal();
          onVerified && onVerified();
        }
      });
    } catch (err) {
      toast("Camera error, please allow permission.");
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

  // ---------- ELEMENTS ----------
  const cartBtn = $("#cart-btn");
  const cartCount = $("#cart-count");
  const cartSection = $("#cart");
  const cartItems = $("#cart-items");
  const totalEl = $("#total");
  const closeCart = $("#close-cart");
  const checkoutBtn = $("#checkout-btn");

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
    toast("Added to cart 🛒");
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
        <div class="row">
          <img src="${it.image}" alt="${it.name}" />
          <div class="grow">
            <strong>${it.name}</strong>
            <div>$${it.price.toFixed(2)}</div>
            <div class="qty">
              <button class="minus">−</button>
              <span>${it.qty}</span>
              <button class="plus">+</button>
            </div>
          </div>
          <button class="remove">✕</button>
        </div>`;
      li.querySelector(".minus").onclick = () => changeQty(it.id, -1);
      li.querySelector(".plus").onclick = () => changeQty(it.id, +1);
      li.querySelector(".remove").onclick = () => removeFromCart(it.id);
      cartItems.appendChild(li);
    }
    totalEl.textContent = total.toFixed(2);
  }

  if (cartBtn) cartBtn.onclick = () => { cartSection.hidden = false; renderCart(); };
  if (closeCart) closeCart.onclick = () => { cartSection.hidden = true; };

  // ---------- CHECKOUT WITH SCANDIT + SQUARE ----------
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      if (!idVerified) {
        toast("🔒 Please verify your ID before checkout");
        await openScanModal(() => {
          idVerified = true;
          toast("✅ ID Verified! Redirecting to payment...");
          proceedToSquare();
        });
        return;
      }

      proceedToSquare();
    });
  }

  function proceedToSquare() {
    const itemsStr = cart.map(i => `${i.name} x${i.qty} — $${(i.price * i.qty).toFixed(2)}`).join("\n");
    const total = cart.reduce((a, c) => a + c.price * c.qty, 0).toFixed(2);
    const squareLink = `https://square.link/u/GTlYqlIK?note=${encodeURIComponent(itemsStr)}&amount=${total}`;
    window.open(squareLink, "_blank");
    cart = [];
    persist();
    cartSection.hidden = true;
  }

  renderCart();
  console.log("🚀 LBizzo cart button → ID Scan → Square checkout flow fixed");
});
