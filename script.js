document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo JS booting...");

  // ---------- EMAILJS INIT ----------
  try {
    if (window.emailjs) {
      emailjs.init("jUx6gEqKI1tvL7yLs"); // ✅ your public key
      console.log("✅ EmailJS initialized");
    }
  } catch (err) {
    console.error("❌ EmailJS init error:", err);
  }

  // ---------- SQUARE LINK ----------
  const SQUARE_BASE = "https://square.link/u/GOvQxhqG"; // ✅ your real Square base link

  // ---------- HELPERS ----------
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

  // ---------- AGE GATE ----------
  const ageOverlay = $("#age-overlay");
  on("#yesBtn", "click", () => ageOverlay && (ageOverlay.style.display = "none"));
  on("#noBtn", "click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    location.href = "https://google.com";
  });

  // ---------- CART ----------
  const cartList = $("#cart-items");
  const cartCount = $("#cart-count");
  const totalEl = $("#cart-total");
  const checkoutBtn = $("#checkout-btn");
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

  // ---------- EMAILJS SEND FUNCTION ----------
  async function sendOrderEmail(orderData) {
    try {
      console.log("📧 Sending order via EmailJS...", orderData);
      const response = await emailjs.send(
        "service_bk310ht",
        "template_sb8tg8bk",
        orderData
      );
      console.log("✅ EmailJS response:", response.status);
      alert("📧 Order sent successfully to LBizzo!");
    } catch (err) {
      console.error("❌ EmailJS error:", err);
      alert("⚠️ There was a problem sending your order. Please try again.");
    }
  }

  // ---------- LOYALTY STARS ----------
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

  // ---------- ID VERIFICATION FLAG ----------
  let ID_VERIFIED = false;
  window.ID_VERIFIED = false;

  // 🔒 lock checkout until verified (mirrors the HTML lock script)
  (function lockCheckout() {
    if (!checkoutBtn) return;
    checkoutBtn.disabled = true;
    document.addEventListener("id-verified", () => { checkoutBtn.disabled = false; });
    document.addEventListener("id-reset",    () => { checkoutBtn.disabled = true;  });
    checkoutBtn.addEventListener("click", (e) => {
      if (!window.ID_VERIFIED) {
        e.preventDefault();
        alert("⚠️ Please scan a valid driver’s license first.");
      }
    });
  })();

  // ---------- CHECKOUT ----------
  on(checkoutBtn, "click", async () => {
    if (!cart.length) return alert("Your cart is empty!");
    if (!ID_VERIFIED && !window.ID_VERIFIED)
      return alert("⚠️ Please verify your ID before checkout.");

    const total = cart
      .reduce((s, it) => s + (Number(it.price) || 0), 0)
      .toFixed(2);
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
      await sendOrderEmail(orderData);
      addLoyaltyStar();
      cart = [];
      updateCartUI();
      alert("🛒 Order sent successfully! Redirecting to checkout...");

      // ✅ AUTO AMOUNT IN SQUARE LINK
      const totalCents = Math.round(parseFloat(total) * 100);
      const checkoutURL = `${SQUARE_BASE}?amount=${totalCents}`;
      window.open(checkoutURL, "_blank");

    } catch (e) {
      console.error(e);
      alert("⚠️ Could not complete checkout. Please try again.");
    }
  });

  updateCartUI();

  // ---------- FIRESTORE PRODUCTS ----------
  const productList = $("#product-list");
  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'><rect width='100%' height='100%' fill='%23111'/><rect x='12' y='12' width='456' height='336' rx='18' fill='black' stroke='%23ff8c00' stroke-width='6'/><text x='50%25' y='55%25' text-anchor='middle' font-family='Arial' font-size='42' fill='%23ff8c00'>LBizzo</text></svg>";

  async function getImageURL(path) {
    try {
      return await firebase.storage().ref(path).getDownloadURL();
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
      <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name || "Product"}"
        onerror="this.src='${PLACEHOLDER_IMG}'" />
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

  // ---------- SCANDIT SCANNER ----------
  const scanStart = $("#scanStart");
  const scanStop  = $("#scanStop");
  const scanOut   = $("#scanOut");
  let scanner = null;

  on(scanStart, "click", async () => {
    try {
      if (!window.ScanditSDK || !ScanditSDK.BarcodePicker) {
        scanOut.textContent = "❌ Scandit SDK not loaded properly.";
        return;
      }

      scanner = await ScanditSDK.BarcodePicker.create($("#scanVideo"), {
        playSoundOnScan: true,
        vibrateOnScan: true,
        accessCamera: true,
      });

      const settings = new ScanditSDK.ScanSettings({
        enabledSymbologies: ["pdf417"], // stricter: driver's license only
        codeDuplicateFilter: 1000,
      });
      scanner.applyScanSettings(settings);

      scanner.on("scan", (res) => {
        const codeText = res.barcodes.map((b) => b.data).join("\n");
        console.log("🔍 Scanned data:", codeText);

        // Strong validation: header + DOB + DL/name field
        const hasHeader = /^@?ANSI ?\d{6} ?\d{2}/.test(codeText) || /AAMVA/i.test(codeText);
        const matchDOB  = codeText.match(/DBB(\d{8})/);
        const hasCore   = /(DAQ|DCS|DAA)/i.test(codeText);

        if (!hasHeader || !matchDOB || !hasCore) {
          scanOut.textContent = "⚠️ Not a valid driver’s-license barcode. Try again.";
          ID_VERIFIED = false;
          window.ID_VERIFIED = false;
          document.dispatchEvent(new Event("id-reset"));
          return;
        }

        const dob = matchDOB[1];
        const year = +dob.slice(0, 4);
        const month = +dob.slice(4, 6) - 1;
        const day = +dob.slice(6, 8);
        const birth = new Date(year, month, day);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

        scanOut.textContent = `📅 DOB: ${year}-${month + 1}-${day} | Age: ${age}`;

        if (age >= 21) {
          alert("✅ Verified: customer is 21 or older.");
          ID_VERIFIED = true;
          window.ID_VERIFIED = true;
          document.dispatchEvent(new Event("id-verified"));
        } else {
          alert("🚫 Customer is under 21 — checkout disabled.");
          ID_VERIFIED = false;
          window.ID_VERIFIED = false;
          document.dispatchEvent(new Event("id-reset"));
        }
      });

      scanOut.textContent =
        "📸 Scanner started. Point camera at the BACK barcode of your ID.";
    } catch (err) {
      scanOut.textContent = "❌ Scanner error: " + err.message;
      console.error(err);
      document.dispatchEvent(new Event("id-reset"));
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
}); // DOMContentLoaded

// ---------- SERVICE WORKER ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(() => console.log("✅ Service Worker registered"))
    .catch((err) => console.error("❌ SW failed:", err));
}

// ---------- WEB APP INSTALL ----------
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById("install-btn");
  if (!btn) return;
  btn.hidden = false;
  btn.onclick = async () => {
    btn.hidden = true;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  };
});
window.addEventListener("appinstalled", () =>
  alert("✅ LBizzo Vape Shop installed successfully!")
);
