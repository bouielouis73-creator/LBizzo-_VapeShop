document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo JS booting...");

  // ---------- EMAILJS INIT ----------
  emailjs.init("f05GO0Wo8vkel_HXz");
  console.log("✅ EmailJS connected");

  // ---------- SQUARE LINK ----------
  const SQUARE_LINK = "https://square.link/u/GOvQxhqG"; // your Square checkout link

  // Helpers
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const debugBar = $("#debug");
  const debug = (msg, ok = false) => {
    if (!debugBar) return;
    debugBar.textContent = msg;
    debugBar.style.background = ok ? "#022" : "#220";
    debugBar.style.color = ok ? "#7fffb3" : "#ff6666";
    debugBar.hidden = false;
  };

  // Age gate
  const ageOverlay = $("#age-overlay");
  on($("#yesBtn"), "click", () => (ageOverlay.style.display = "none"));
  on($("#noBtn"), "click", () => { 
    alert("Sorry, you must be 21 or older to enter."); 
    location.href="https://google.com"; 
  });

  // Cart
  const cartList = $("#cart-items");
  const cartCount = $("#cart-count");
  const totalEl = $("#cart-total");
  const checkoutBtn = $("#checkout-btn");
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  function updateCartUI() {
    cartList.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
      const p = Number(item.price) || 0;
      total += p;
      const li = document.createElement("li");
      li.innerHTML = `${item.name} - $${p.toFixed(2)} <button class="remove" data-i="${i}">❌</button>`;
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
    if (!Number.isNaN(i)) { cart.splice(i, 1); updateCartUI(); }
  });

  // ---------- EMAILJS SEND FUNCTION ----------
  async function sendOrderEmail(orderData) {
    try {
      const response = await emailjs.send("service_mos7x3m", "template_kw9vt5f", orderData);
      console.log("✅ Order email sent:", response.status);
      alert("Order sent successfully! 📧");
    } catch (err) {
      console.error("❌ Failed to send email:", err);
      alert("There was a problem sending the email.");
    }
  }

  // Loyalty stars
  const stars = $$("#loyalty-stars .star");
  let loyalty = parseInt(localStorage.getItem("loyaltyCount") || "0", 10);
  const renderStars = () => stars.forEach((s,i)=> s.classList.toggle("active", i < loyalty));
  function addLoyaltyStar(){ 
    loyalty++; 
    if (loyalty >= 6){ 
      alert("🎉 Free vape earned!"); 
      loyalty = 0; 
    } 
    localStorage.setItem("loyaltyCount", String(loyalty)); 
    renderStars(); 
  }
  renderStars();

  // ---------- CHECKOUT: EMAILJS + SQUARE ----------
  on(checkoutBtn, "click", async () => {
    if (!cart.length) return alert("Your cart is empty!");
    const total = cart.reduce((s, it) => s + (Number(it.price)||0), 0).toFixed(2);

    const customerName = prompt("Enter your name:");
    const customerPhone = prompt("Enter your phone number:");
    const customerAddress = prompt("Enter your delivery address:");

    const orderData = {
      name: customerName || "Unknown",
      phone: customerPhone || "N/A",
      address: customerAddress || "N/A",
      items: cart.map(i => `${i.name} ($${i.price})`).join(", "),
      total: `$${total}`
    };

    try {
      await sendOrderEmail(orderData); // send via EmailJS
      addLoyaltyStar();
      cart = [];
      updateCartUI();
      alert("🛒 Order sent! Proceeding to payment…");
      window.open(`${SQUARE_LINK}?amount=${total}`, "_blank"); // go to Square
    } catch (e) {
      alert("⚠️ Could not send order: " + (e?.text || e));
    }
  });

  updateCartUI();

  // ---------- PRODUCTS (Firestore + Storage) ----------
  const productList = $("#product-list");
  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'><rect width='100%' height='100%' fill='%23111'/><rect x='12' y='12' width='456' height='336' rx='18' fill='black' stroke='%23ff8c00' stroke-width='6'/><text x='50%25' y='55%25' text-anchor='middle' font-family='Arial' font-size='42' fill='%23ff8c00'>LBizzo</text></svg>";

  async function addCard(p) {
    const priceNum = Number(p.price) || 0;
    const imgURL = p.image && !/^https?:\/\//i.test(p.image)
      ? await getImageURL(p.image)
      : p.image;
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name || "Product"}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <h3>${p.name || "Unnamed Product"}</h3>
      <p>$${priceNum.toFixed(2)}</p>
      <button class="add-btn btn">Add to Cart</button>
    `;
    card.querySelector(".add-btn").addEventListener("click", () => {
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
      productList.innerHTML = "";
      for (const doc of snap.docs) {
        await addCard(doc.data());
      }
    } catch (err) {
      console.warn("Firestore error:", err.message);
      debug("Showing 50 placeholders (no products yet).");
      productList.innerHTML = "";
      for (let i=1;i<=50;i++) await addCard({ name:`LBizzo Placeholder #${i}`, price:0 });
    }
  }

  await loadProducts();

  // ---------- SCANDIT ID SCANNER ----------
  const scanStart = $("#scanStart");
  const scanStop  = $("#scanStop");
  const scanOut   = $("#scanOut");
  let scanner = null;

  on(scanStart, "click", async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        scanOut.textContent = "❌ Camera access not supported or blocked. Try normal Safari (not Private Mode) or Chrome.";
        return;
      }
      if (!window.ScanditSDK || !ScanditSDK.BarcodePicker) {
        scanOut.textContent = "❌ Scanner not supported on this browser/device.";
        return;
      }

      scanner = await ScanditSDK.BarcodePicker.create($("#scanVideo"), {
        playSoundOnScan: true,
        vibrateOnScan: true,
        accessCamera: true
      });
      const settings = new ScanditSDK.ScanSettings({
        enabledSymbologies: ["pdf417", "qr", "code128"],
        codeDuplicateFilter: 1000
      });
      scanner.applyScanSettings(settings);
      scanner.on("scan", (res) => {
        const codes = res.barcodes.map(b => b.data).join("\n");
        scanOut.textContent = "✅ Scanned:\n" + codes;
      });
      scanOut.textContent = "📸 Scanner started. Point camera at barcode.";
    } catch (err) {
      scanOut.textContent = "❌ Scanner error: " + err.message + "\nTry opening in regular Safari or Chrome.";
      console.error(err);
    }
  });

  on(scanStop, "click", () => {
    if (scanner) { scanner.destroy(); scanner = null; }
    scanOut.textContent = "Scanner stopped.";
  });

  // ---------- FALLBACK CAMERA SCANNER (for iPhone/Safari) ----------
  async function startFallbackScanner() {
    const video = document.getElementById("scanVideo");
    const scanOut = document.getElementById("scanOut");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
      video.setAttribute("playsinline", true);
      await video.play();
      scanOut.textContent = "📸 Camera started (fallback mode). Move ID barcode into view...";

      const barcodeDetector = ("BarcodeDetector" in window)
        ? new BarcodeDetector({ formats: ["pdf417", "qr_code", "code_128"] })
        : null;

      if (!barcodeDetector) {
        scanOut.textContent = "⚠️ BarcodeDetector not supported. You can still view camera, but scanning may be manual.";
        return;
      }

      const detectLoop = async () => {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0) {
            scanOut.textContent = "✅ Scanned:\n" + barcodes.map(b => b.rawValue).join("\n");
            stream.getTracks().forEach(t => t.stop());
            return;
          }
        } catch (e) {
          console.warn("Detection error:", e);
        }
        requestAnimationFrame(detectLoop);
      };
      detectLoop();
    } catch (err) {
      console.error("Fallback scanner error:", err);
      scanOut.textContent = "❌ Cannot access camera: " + err.message;
    }
  }

  // Auto-enable fallback if Scandit unsupported
  if (!window.ScanditSDK || !ScanditSDK.BarcodePicker) {
    console.warn("Scandit not supported, enabling fallback scanner...");
    const fallbackBtn = document.getElementById("scanStart");
    if (fallbackBtn) {
      fallbackBtn.addEventListener("click", startFallbackScanner);
    }
  }

}); // DOMContentLoaded

// ---------- SERVICE WORKER (PWA) ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("✅ Service Worker registered"))
    .catch(err => console.error("❌ SW failed:", err));
}

// ---------- WEB APP INSTALL BUTTON ----------
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
window.addEventListener("appinstalled", () => {
  alert("✅ LBizzo Vape Shop installed successfully!");
});
