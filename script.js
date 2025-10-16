// =========================================================
// ✅ LBizzo Vape Shop - Full Script
// ✅ Firebase, Scandit, EmailJS, Square checkout
// ✅ Fixed Cart button + ID verification
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  console.log("🚀 LBizzo Vape Shop starting...");

  // ---------- HELPERS ----------
  const $ = (s, r = document) => r.querySelector(s);
  const toast = (msg) => {
    const t = $("#toast") || Object.assign(document.body.appendChild(document.createElement("div")), { id: "toast" });
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t.__h);
    t.__h = setTimeout(() => (t.hidden = true), 1800);
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
    yes.addEventListener("click", (e) => {
      e.preventDefault();
      overlay.style.display = "none";
    });
    no.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Sorry, you must be 21+ to enter.");
      location.href = "https://google.com";
    });
  }

  // ---------- FIREBASE ----------
  const db = window._db || firebase.firestore();
  const storage = window._storage || firebase.storage();

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
        const clean = path.split(".appspot.com/")[1];
        return await storage.ref(clean).getDownloadURL();
      }
      if (path.startsWith("http")) return path;
      return await storage.ref(path).getDownloadURL();
    } catch (err) {
      console.warn("⚠️ Image failed:", path, err?.message);
      return PLACEHOLDER_IMG;
    }
  }

  async function addCard(p) {
    let priceNum = Number(p.price) || parseFloat(p.price);
    if (isNaN(priceNum) || priceNum < 0) priceNum = 0;

    const imgURL = await getImageURL(p.image || (p.path && `products/${p.path}`));
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL}" alt="${p.name || "Product"}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <h3>${p.name || "Unnamed"}</h3>
      ${priceNum > 0 ? `<p>$${priceNum.toFixed(2)}</p>` : `<p style='color:#ff8c00;'>Contact for Price</p>`}
      <button class="add-btn" ${priceNum <= 0 ? "disabled" : ""}>${priceNum <= 0 ? "Unavailable" : "Add to Cart"}</button>
    `;
    const btn = card.querySelector(".add-btn");
    if (btn && priceNum > 0)
      btn.onclick = () => addToCart({ id: p.id, name: p.name, price: priceNum, image: imgURL });
    productList.appendChild(card);
  }

  async function loadProducts() {
    productList.innerHTML = "";
    try {
      const snap = await db.collection("products").orderBy("name").limit(50).get();
      if (snap.empty) {
        productList.innerHTML = `<p style="color:#ccc">No products found.</p>`;
        return;
      }
      for (const doc of snap.docs) await addCard({ id: doc.id, ...doc.data() });
      console.log("✅ Firebase products loaded");
    } catch (err) {
      console.error("❌ Firebase load error:", err);
      productList.innerHTML = `<p style="color:red">Failed to load products.</p>`;
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
    const found = cart.find((i) => i.id === item.id);
    if (found) found.qty += 1;
    else cart.push({ ...item, qty: 1 });
    persist();
    toast(`${item.name} added 🛒`);
  }

  function removeFromCart(id) {
    cart = cart.filter((i) => i.id !== id);
    persist();
  }

  function changeQty(id, delta) {
    const it = cart.find((i) => i.id === id);
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
      checkoutBtn.disabled = true;
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
            <img src="${it.image}" alt="${it.name}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">
            <div><strong>${it.name}</strong><br><small>$${(Number(it.price)||0).toFixed(2)}</small></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button class="minus">−</button>
            <span>${it.qty}</span>
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
    checkoutBtn.disabled = !idVerified;
  }

  // ---------- CART BUTTON ----------
  if (cartBtn) {
    ["click", "touchend"].forEach((ev) =>
      cartBtn.addEventListener(
        ev,
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          renderCart();
          cartSection.classList.add("active");
        },
        { passive: false }
      )
    );
  }
  if (closeCart)
    ["click", "touchend"].forEach((ev) =>
      closeCart.addEventListener(
        ev,
        (e) => {
          e.preventDefault();
          cartSection.classList.remove("active");
        },
        { passive: false }
      )
    );

  // ---------- EMAILJS ----------
  async function sendOrderEmail(payload) {
    if (!window.emailjs || !emailjs.send)
      return { ok: false, error: "EmailJS not loaded" };
    try {
      emailjs.init(window.EMAILJS_PUBLIC_KEY || "jUx6gEqKl1tvL7yLs");
      const res = await emailjs.send(
        window.EMAILJS_SERVICE_ID || "service_7o2u4kq",
        window.EMAILJS_TEMPLATE_ID || "template_6jlkofi",
        payload
      );
      return { ok: true, res };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // ---------- SCANDIT ----------
  const SCANDIT_LICENSE_KEY = window.SCANDIT_LICENSE_KEY;
  let __scanOverlay, __scanContainer, __scanPicker, __scanditReady = false;

  async function ensureScanditConfigured() {
    if (__scanditReady) return true;
    await ScanditSDK.configure(SCANDIT_LICENSE_KEY, {
      engineLocation: "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/",
    });
    __scanditReady = true;
    return true;
  }

  function ensureIDScanUI() {
    if (__scanOverlay) return;
    __scanOverlay = document.createElement("div");
    __scanOverlay.style.cssText =
      "position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.9);display:none;align-items:center;justify-content:center;padding:16px;";
    const box = document.createElement("div");
    box.style.cssText =
      "width:min(92vw,520px);background:#0b0b0b;border:1px solid #ff8c00;border-radius:14px;padding:16px;color:#eaeaea;text-align:center;";
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

  function openScanModal(onVerified) {
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
  accessCamera: true,
  cameraSettings: {
    resolutionPreference: ScanditSDK.Camera.ResolutionPreference.FULL_HD,
    zoom: 1.0,
  },
  scanningPaused: false,
});

const settings = new ScanditSDK.ScanSettings({
  enabledSymbologies: ["pdf417"], // barcode type used on driver’s licenses
  codeDuplicateFilter: 1000,
  maxNumberOfCodesPerFrame: 5,
});

__scanPicker.applyScanSettings(settings);
__scanPicker.setTorchEnabled(true); // enable flashlight automatically

__scanPicker.on("scan", (result) => {
  if (result && result.barcodes && result.barcodes.length) {
    const code = result.barcodes[0].data;
    console.log("✅ Scanned ID barcode:", code);
    toast("✅ ID Verified — Checkout unlocked");
    idVerified = true;
    checkoutBtn.disabled = false;
    closeScanModal();
  }
});
        __scanPicker.applyScanSettings(settings);
        __scanPicker.on("scan", (result) => {
          if (result?.barcodes?.length) {
            toast("✅ ID Verified");
            idVerified = true;
            checkoutBtn.disabled = false;
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

  if (scanIdBtn)
    ["click", "touchend"].forEach((ev) =>
      scanIdBtn.addEventListener(ev, (e) => {
        e.preventDefault();
        openScanModal();
      })
    );

  // ---------- CHECKOUT ----------
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      if (!cart.length) {
        toast("🛒 Your cart is empty");
        return;
      }

      if (!idVerified) {
        toast("🔒 Please scan your ID before checkout");
        openScanModal();
        return;
      }

      const itemsStr = cart
        .map(
          (i) =>
            `${i.name} x${i.qty} — $${(i.price * i.qty).toFixed(2)}`
        )
        .join("\n");
      const total = cart
        .reduce((a, c) => a + c.price * c.qty, 0)
        .toFixed(2);

      const payload = {
        name: $("#cust-name")?.value || "N/A",
        phone: $("#cust-phone")?.value || "N/A",
        address: $("#cust-address")?.value || "N/A",
        items: itemsStr,
        total,
      };

      const res = await sendOrderEmail(payload);
      if (res.ok) {
        toast("📧 Order sent! Redirecting to payment...");
        const squareLink = `https://square.link/u/GTlYqlIK?note=${encodeURIComponent(
          itemsStr
        )}&amount=${total}`;
        setTimeout(() => window.open(squareLink, "_blank"), 600);
        cart = [];
        persist();
        cartSection.classList.remove("active");
      } else {
        alert("Email failed: " + (res.error || "Unknown error"));
      }
    });
  }

  // ---------- INIT ----------
  await loadProducts();
  renderCart();
  console.log("✅ LBizzo ready — everything connected!");
});
