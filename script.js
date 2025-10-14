/* ========= SCANDIT: stable loader (waits until fully ready) ========= */
window.ScanditReady = false;

(async () => {
  try {
    // Fallback loader if script tag didn’t load yet
    if (!window.ScanditSDK) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/scandit-sdk@5.12.1/build/browser/scandit-sdk.min.js";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    console.log("⏳ Configuring Scandit SDK…");
    await ScanditSDK.configure(
      "AjeGjTUcEtL1CJWakqGDsHUqNSa2FUaEfgpehFQktDUvftJypGR1uUk4YOe9U57HnWknn6FAegM/Wa/Oul2VLYxdP6h8QNRpqnO6VYQmJrB/Fz8zCSq5ZxMO4g1dbz/yk0KhxtRmyOJUQZ3lPHPLmXRItF4heDTY2040ZyZ7hODuQ7g+6kYMgmRVn8G+Fv5waQ/MN/Rf7YmZYFPd7GGlg5Ry5dTxavIgUWA4H6dGZVnSUvih0lpLVZJ++O79R7YSL2CNET10lSNXXNySjEJ7o31fUt9aeyI1YmqYgLdMSQsDVEBqp3K+OEdPPAg1Qwrrb3S+c7ti7TGoQDhPAExRC61b3frNUhmU80Csg/Rr9GecBDyIbmFEGz52LPQ1a0vT2RpSouZ9gfC0YbTZpEwDNXha9vBcckqEUUeggFAakLpyVRj8231A8bd3emXvehAJRHGhqZNQEJWVeFq31B7mofwKdElOXyEFCSmAgGlY/hq9VPmkt3F4w9UNbPT8YGE5JW4v5JNu6TofHrsdVyEqKQIJNCUKDuNNKQrzA0ESIq/x/gNdCr/PbIjzx7i0L8yeYXuolP1vzJdIvhJvvt8vifaFwtftAmWCUj4GlFBq0e22RwYI7to1tt1IJ3llMZeAP6s6RreABtf8ZpeMyJd9Cw2VF2+7ZWrTNS0j2GqUH78Bt3CYOjli8Bg4YBrlKHjKFYo7jL49/b+4tN3BvSXJbn/7CK+AZ6PjYBKBmuQqQUUwotp7Gvd/0sjt3H7OWrAQb3n8mYK8u6WmJjuLIKQKSt6YoqfPviaj8N7ThlEter9fCXdlhqWDIIiBU0AXbn/jlCEVmhtvSUcXEh2QhNPaig8sLBrjtXnZQh/JNz2x9Xn49PMKUP0C/qia+HS09dfmKgNUDU0ikax1oVu7GlZPrIWhF5R41jZI60TqRMgx5Z4Q4k8oaEw0GLenxOJDxs9ehoPEY634tjJ+NV+8eU9VtOYtiQ5+5WJkf1yMZGtrdpo15xjZZHOjJwusEnEdzoXW1woDQDMrsQn1OnAG6VlALE73S15l9kPSZ1NDknDDitiRlxe1XIn3P7wFwG80QMQY58vTJ1rCdUF2mzg11LbTy/1YZyyn65CjsSGqWQLQrW9z3GoRR7+h35tBltE49sR7+JNR4U+e7qwb52bAQoWa0DLxsiswAAUjZcGevTCpWQvvxwhOqjCNcD/7Fxkpfc5NVvM=",
      { engineLocation: "https://cdn.jsdelivr.net/npm/scandit-sdk@5.12.1/build/" }
    );
    await ScanditSDK.ready();
    window.ScanditReady = true;
    console.log("✅ Scandit SDK fully ready");
    document.dispatchEvent(new Event("scandit-ready"));
  } catch (e) {
    console.error("❌ Scandit SDK failed:", e);
  }
})();

/* ===================== MAIN APP ===================== */
document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo JS booting…");

  /* Firebase references */
  const db = firebase.firestore();
  const storage = firebase.storage();

  /* EmailJS */
  try {
    if (window.emailjs) {
      emailjs.init("jUx6gEqKI1tvL7yLs");
      console.log("✅ EmailJS initialized");
    }
  } catch (err) {
    console.error("❌ EmailJS init error:", err);
  }

  /* Helpers */
  const SQUARE_BASE = "https://square.link/u/GOvQxhqG";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const on = (sel, ev, fn) => {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (el) el.addEventListener(ev, fn);
  };
  const debugBar = $("#debug");
  const debug = (msg, ok = false) => {
    if (!debugBar) return;
    debugBar.textContent = msg;
    debugBar.style.background = ok ? "#022" : "#220";
    debugBar.style.color = ok ? "#7fffb3" : "#ff6666";
    debugBar.hidden = false;
  };

  /* Age Gate */
  const ageOverlay = $("#age-overlay");
  on("#yesBtn", "click", () => ageOverlay && (ageOverlay.style.display = "none"));
  on("#noBtn", "click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    location.href = "https://google.com";
  });

  /* Cart System */
  const cartList = $("#cart-items"),
    cartCount = $("#cart-count"),
    totalEl = $("#cart-total"),
    checkoutBtn = $("#checkout-btn");
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  function updateCartUI() {
    if (!cartList || !cartCount || !totalEl) return;
    cartList.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
      const p = Number(item.price) || 0;
      total += p;
      const li = document.createElement("li");
      li.innerHTML = `${item.name} - $${p.toFixed(
        2
      )} <button class="remove" data-i="${i}">❌</button>`;
      cartList.appendChild(li);
    });
    totalEl.textContent = `Total: $${total.toFixed(2)}`;
    cartCount.textContent = cart.length;
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  on(cartList, "click", (e) => {
    const btn = e.target.closest(".remove");
    if (!btn) return;
    const i = Number(btn.dataset.i);
    if (!Number.isNaN(i)) {
      cart.splice(i, 1);
      updateCartUI();
    }
  });

  /* Loyalty System */
  const stars = $$("#loyalty-stars .star");
  let loyalty = parseInt(localStorage.getItem("loyaltyCount") || "0", 10);
  const renderStars = () =>
    stars.forEach((s, i) => s.classList.toggle("active", i < loyalty));
  function addLoyaltyStar() {
    loyalty++;
    if (loyalty >= 6) {
      alert("🎉 Free vape earned!");
      loyalty = 0;
    }
    localStorage.setItem("loyaltyCount", String(loyalty));
    renderStars();
  }
  renderStars();

  /* ID Verification flag */
  let ID_VERIFIED = false;
  window.ID_VERIFIED = false;

  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    document.addEventListener("id-verified", () => {
      checkoutBtn.disabled = false;
      $("#checkout-hint").textContent = "✅ ID verified — you can checkout";
      $("#checkout-hint").style.color = "#00a86b";
    });
    document.addEventListener("id-reset", () => {
      checkoutBtn.disabled = true;
      $("#checkout-hint").textContent = "🔒 Scan ID to enable checkout";
      $("#checkout-hint").style.color = "#888";
    });
  }

  /* Checkout */
  on(checkoutBtn, "click", async () => {
    if (!cart.length) return alert("Your cart is empty!");
    if (!window.ID_VERIFIED) return alert("⚠️ Please verify your ID first.");
    const total = cart.reduce((s, it) => s + (Number(it.price) || 0), 0).toFixed(2);
    const name = prompt("Enter your name:") || "Unknown";
    const phone = prompt("Enter your phone number:") || "N/A";
    const address = prompt("Enter your delivery address:") || "N/A";
    const orderData = {
      name,
      phone,
      address,
      items: cart.map((i) => `${i.name} ($${i.price})`).join(", "),
      total: `$${total}`,
    };
    try {
      await emailjs.send("service_bk310ht", "template_sb8tg8bk", orderData);
      addLoyaltyStar();
      cart = [];
      updateCartUI();
      alert("🛒 Order sent! Redirecting to checkout…");
      const totalCents = Math.round(parseFloat(total) * 100);
      window.open(`${SQUARE_BASE}?amount=${totalCents}`, "_blank");
    } catch (e) {
      console.error(e);
      alert("⚠️ Could not complete checkout. Please try again.");
    }
  });
  updateCartUI();

  /* Firestore Products */
  const productList = $("#product-list");
  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'><rect width='100%' height='100%' fill='%23111'/><rect x='12' y='12' width='456' height='336' rx='18' fill='black' stroke='%23ff8c00' stroke-width='6'/><text x='50%25' y='55%25' text-anchor='middle' font-family='Arial' font-size='42' fill='%23ff8c00'>LBizzo</text></svg>";

  async function getImageURL(path) {
    try {
      return await storage.ref(path).getDownloadURL();
    } catch {
      return null;
    }
  }

  async function addCard(p) {
    const priceNum = Number(p.price) || 0;
    const imgURL =
      p.image && !/^https?:\/\//i.test(p.image)
        ? await getImageURL(p.image)
        : p.image;
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name || "Product"}" onerror="this.src='${PLACEHOLDER_IMG}'"/>
      <h3>${p.name || "Unnamed Product"}</h3>
      <p>$${priceNum.toFixed(2)}</p>
      <button class="add-btn btn">Add to Cart</button>
    `;
    on(card.querySelector(".add-btn"), "click", () => {
      cart.push({ name: p.name || "Item", price: priceNum });
      updateCartUI();
    });
    productList.appendChild(card);
  }

  async function loadProducts() {
    try {
      const snap = await db.collection("products").get();
      if (!snap || snap.empty) throw new Error("No Firestore products");
      debug(`Connected to Firestore • ${snap.size} product(s)`, true);
      setTimeout(() => (debugBar.hidden = true), 4000);
      productList.innerHTML = "";
      for (const doc of snap.docs) await addCard(doc.data());
    } catch (err) {
      console.warn("Firestore error:", err.message);
      debug("Showing 50 placeholders (no products yet).");
      productList.innerHTML = "";
      for (let i = 1; i <= 50; i++)
        await addCard({ name: `LBizzo Placeholder #${i}`, price: 0 });
    }
  }

  await loadProducts();

  /* ---------- Scandit live scanner ---------- */
  const scanStart = $("#scanStart"),
    scanStop = $("#scanStop"),
    scanOut = $("#scanOut"),
    scanArrow = $("#scanArrow"),
    statusEl = $("#scanner-status");
  let scanner = null;

  function ensureScanditReadyOrWarn() {
    if (window.ScanditReady) return true;
    alert("⚠️ Scandit not ready yet, please wait a few seconds.");
    return false;
  }

  document.addEventListener("scandit-ready", () => {
    if (statusEl) {
      statusEl.textContent = "✅ Scandit ready — you can now scan or upload ID.";
      statusEl.style.color = "#00ff88";
    }
  });

  on(scanStart, "click", async () => {
    if (!ensureScanditReadyOrWarn()) return;
    try {
      if (!ScanditSDK.BarcodePicker) {
        scanOut.textContent = "❌ Scandit UI not available.";
        return;
      }
      scanner = await ScanditSDK.BarcodePicker.create($("#scanVideo"), {
        playSoundOnScan: true,
        vibrateOnScan: true,
        accessCamera: true,
      });
      const settings = new ScanditSDK.ScanSettings({
        enabledSymbologies: ["pdf417"],
        codeDuplicateFilter: 1000,
      });
      scanner.applyScanSettings(settings);
      scanOut.textContent =
        "📸 Scanner started. Point camera at the BACK barcode of your ID.";
      scanArrow.style.display = "block";
      setTimeout(() => (scanArrow.style.opacity = 0), 5000);

      scanner.on("scan", (res) => {
        const txt = res.barcodes.map((b) => b.data).join("\n");
        const dobMatch = txt.match(/DBB(\d{8})/);
        const hasHeader = /^@?ANSI ?\d{6} ?\d{2}/.test(txt) || /AAMVA/i.test(txt);
        if (!dobMatch || !hasHeader) {
          scanOut.textContent = "⚠️ Invalid barcode. Try again.";
          window.ID_VERIFIED = false;
          document.dispatchEvent(new Event("id-reset"));
          return;
        }
        const dob = dobMatch[1];
        const y = +dob.slice(0, 4),
          m = +dob.slice(4, 6) - 1,
          d = +dob.slice(6, 8);
        const birth = new Date(y, m, d);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const mo = now.getMonth() - birth.getMonth();
        if (mo < 0 || (mo === 0 && now.getDate() < birth.getDate())) age--;
        scanOut.textContent = `📅 DOB: ${y}-${m + 1}-${d} | Age: ${age}`;
        if (age >= 21) {
          alert("✅ Verified: 21+");
          window.ID_VERIFIED = true;
          document.dispatchEvent(new Event("id-verified"));
        } else {
          alert("🚫 Under 21 — checkout disabled.");
          window.ID_VERIFIED = false;
          document.dispatchEvent(new Event("id-reset"));
        }
      });
    } catch (err) {
      console.error(err);
      scanOut.textContent = "❌ Scanner error: " + err.message;
      document.dispatchEvent(new Event("id-reset"));
      if (statusEl) {
        statusEl.textContent = "❌ Scandit failed. Retrying…";
        statusEl.style.color = "#ff4444";
      }
    }
  });

  on(scanStop, "click", () => {
    if (scanner) {
      scanner.destroy();
      scanner = null;
      scanOut.textContent = "Scanner stopped.";
      document.dispatchEvent(new Event("id-reset"));
    }
  });

  /* ---------- Photo upload verification ---------- */
  const fileInput = $("#idPhotoInput"),
    idStatus = $("#idUploadStatus");
  on(fileInput, "change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    idStatus.textContent = "🔍 Checking ID photo…";
    window.ID_VERIFIED = false;
    document.dispatchEvent(new Event("id-reset"));

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      idStatus.textContent = "❌ Invalid file type. Upload a clear photo of your ID.";
      alert("❌ Invalid file type.");
      return;
    }

    if (!ensureScanditReadyOrWarn()) {
      idStatus.textContent = "⏳ Waiting for scanner to finish loading…";
      return;
    }

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const result = await ScanditSDK.BarcodeScanner.scanImage(buffer
