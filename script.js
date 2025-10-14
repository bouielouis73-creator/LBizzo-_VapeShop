/* ========= SCANDIT: stable loader (waits until fully ready) ========= */
window.ScanditReady = false;

(async () => {
  try {
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
document.addEventListener("DOMContentLoaded", () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo JS booting…");

  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const on = (sel, ev, fn) => {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (el) el.addEventListener(ev, fn);
  };

  /* 🔞 AGE CHECK */
  const ageOverlay = $("#age-overlay");
  on("#yesBtn", "click", () => {
    ageOverlay && (ageOverlay.style.display = "none");
    console.log("✅ Age confirmed");
  });
  on("#noBtn", "click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    location.href = "https://google.com";
  });

  /* 🔥 FIREBASE INIT CHECK */
  let db, storage;
  try {
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("✅ Firebase connected");
  } catch (err) {
    console.error("⚠️ Firebase not ready:", err);
  }

  /* 💌 EMAILJS INIT */
  try {
    emailjs.init("jUx6gEqKI1tvL7yLs");
    console.log("✅ EmailJS ready");
  } catch (err) {
    console.error("⚠️ EmailJS init failed:", err);
  }

  /* 🛒 CART */
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
      li.innerHTML = `${item.name} - $${p.toFixed(2)} <button class="remove" data-i="${i}">❌</button>`;
      cartList.appendChild(li);
    });
    totalEl.textContent = `Total: $${total.toFixed(2)}`;
    cartCount.textContent = cart.length;
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  updateCartUI();

  on(cartList, "click", (e) => {
    const btn = e.target.closest(".remove");
    if (!btn) return;
    const i = Number(btn.dataset.i);
    if (!Number.isNaN(i)) {
      cart.splice(i, 1);
      updateCartUI();
    }
  });

  /* ⭐ LOYALTY STARS */
  const stars = $$("#loyalty-stars .star");
  let loyalty = parseInt(localStorage.getItem("loyaltyCount") || "0", 10);
  const renderStars = () => stars.forEach((s, i) => s.classList.toggle("active", i < loyalty));
  const addStar = () => {
    loyalty++;
    if (loyalty >= 6) {
      alert("🎉 You earned a free vape!");
      loyalty = 0;
    }
    localStorage.setItem("loyaltyCount", loyalty);
    renderStars();
  };
  renderStars();

  /* 🔐 ID VERIFY FLAGS */
  let ID_VERIFIED = false;
  document.addEventListener("id-verified", () => {
    ID_VERIFIED = true;
    checkoutBtn.disabled = false;
    $("#checkout-hint").textContent = "✅ ID verified — you can checkout";
    $("#checkout-hint").style.color = "#00a86b";
  });
  document.addEventListener("id-reset", () => {
    ID_VERIFIED = false;
    checkoutBtn.disabled = true;
    $("#checkout-hint").textContent = "🔒 Scan ID to enable checkout";
    $("#checkout-hint").style.color = "#888";
  });
  checkoutBtn.disabled = true;

  /* 💳 CHECKOUT BUTTON */
  on(checkoutBtn, "click", async () => {
    if (!cart.length) return alert("🛒 Your cart is empty!");
    if (!ID_VERIFIED) return alert("⚠️ Please scan or upload a valid ID first.");

    const total = cart.reduce((sum, i) => sum + (Number(i.price) || 0), 0).toFixed(2);
    const name = prompt("Enter your name:") || "Unknown";
    const phone = prompt("Enter your phone number:") || "N/A";
    const address = prompt("Enter your delivery address:") || "N/A";

    const order = {
      name,
      phone,
      address,
      items: cart.map(i => `${i.name} ($${i.price})`).join(", "),
      total: `$${total}`
    };

    try {
      await emailjs.send("service_bk310ht", "template_sb8tg8bk", order);
      addStar();
      cart = [];
      updateCartUI();
      alert("✅ Order sent! Redirecting to Square checkout...");
      const totalCents = Math.round(parseFloat(total) * 100);
      window.open(`https://square.link/u/GOvQxhqG?amount=${totalCents}`, "_blank");
    } catch (err) {
      console.error("EmailJS error:", err);
      alert("⚠️ Order failed. Please try again.");
    }
  });

  /* 🧱 LOAD PRODUCTS */
  const productList = $("#product-list");
  const PLACEHOLDER_IMG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'><rect width='100%' height='100%' fill='%23111'/><rect x='12' y='12' width='456' height='336' rx='18' fill='black' stroke='%23ff8c00' stroke-width='6'/><text x='50%25' y='55%25' text-anchor='middle' font-family='Arial' font-size='42' fill='%23ff8c00'>LBizzo</text></svg>";

  async function getImageURL(path) {
    try { return await storage.ref(path).getDownloadURL(); }
    catch { return null; }
  }

  async function addCard(p) {
    const priceNum = Number(p.price) || 0;
    const imgURL = p.image && !/^https?:\/\//i.test(p.image)
      ? await getImageURL(p.image)
      : p.image;

    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name || "Product"}" />
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
      if (!snap.empty) {
        console.log("✅ Loaded products:", snap.size);
        productList.innerHTML = "";
        for (const doc of snap.docs) await addCard(doc.data());
      } else throw new Error("No products in Firestore");
    } catch (err) {
      console.warn("⚠️ Firestore failed:", err.message);
      productList.innerHTML = "";
      for (let i = 1; i <= 30; i++) await addCard({ name: `LBizzo Placeholder #${i}`, price: 0 });
    }
  }
  loadProducts();

  /* 🎥 SCANDIT SCANNER */
  const scanStart = $("#scanStart"), scanStop = $("#scanStop"), scanOut = $("#scanOut"), scanArrow = $("#scanArrow"), statusEl = $("#scanner-status");
  let scanner = null;

  document.addEventListener("scandit-ready", () => {
    if (statusEl) {
      statusEl.textContent = "✅ Scandit ready — you can now scan or upload ID.";
      statusEl.style.color = "#00ff88";
    }
  });

  on(scanStart, "click", async () => {
    if (!window.ScanditReady) return alert("⚠️ Please wait — scanner still loading.");
    try {
      scanner = await ScanditSDK.BarcodePicker.create($("#scanVideo"), {
        playSoundOnScan: true, vibrateOnScan: true, accessCamera: true
      });
      const settings = new ScanditSDK.ScanSettings({ enabledSymbologies: ["pdf417"], codeDuplicateFilter: 1000 });
      scanner.applyScanSettings(settings);
      scanOut.textContent = "📸 Point camera at back barcode of your ID...";
      scanArrow.style.display = "block";
      setTimeout(() => (scanArrow.style.opacity = 0), 4000);

      scanner.on("scan", (res) => {
        const txt = res.barcodes.map(b => b.data).join("\n");
        const dobMatch = txt.match(/DBB(\d{8})/);
        const hasHeader = /^@?ANSI/i.test(txt) || /AAMVA/i.test(txt);
        if (!dobMatch || !hasHeader) return alert("⚠️ Invalid ID. Try again.");
        const y = +dobMatch[1].slice(0, 4);
        const m = +dobMatch[1].slice(4, 6) - 1;
        const d = +dobMatch[1].slice(6, 8);
        const birth = new Date(y, m, d);
        const age = new Date().getFullYear() - birth.getFullYear();
        if (age >= 21) {
          alert("✅ ID Verified: 21+");
          document.dispatchEvent(new Event("id-verified"));
        } else {
          alert("🚫 Under 21");
          document.dispatchEvent(new Event("id-reset"));
        }
      });
    } catch (err) {
      console.error("Scanner error:", err);
      alert("❌ Could not start scanner.");
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

  /* 📸 ID PHOTO UPLOAD */
  const fileInput = $("#idPhotoInput"), idStatus = $("#idUploadStatus");
  on(fileInput, "change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    idStatus.textContent = "🔍 Checking ID photo...";
    if (!["image/jpeg", "image/png"].includes(file.type)) return alert("❌ Invalid file type.");

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const result = await ScanditSDK.BarcodeScanner.scanImage(buffer, { enabledSymbologies: ["pdf417"] });
      if (result.barcodes.length === 0) return alert("⚠️ Could not read barcode from photo.");
      const txt = result.barcodes[0].data;
      const dob = txt.match(/DBB(\d{8})/);
      if (!dob) return alert("⚠️ No DOB found in barcode.");
      const y = +dob[1].slice(0, 4), m = +dob[1].slice(4, 6) - 1, d = +dob[1].slice(6, 8);
      const age = new Date().getFullYear() - y;
      if (age >= 21) {
        idStatus.textContent = "✅ ID verified by photo (21+)";
        document.dispatchEvent(new Event("id-verified"));
      } else {
        idStatus.textContent = "🚫 Under 21 — cannot checkout";
        document.dispatchEvent(new Event("id-reset"));
      }
    } catch (err) {
      console.error(err);
      idStatus.textContent = "❌ Could not verify ID photo.";
    }
  });

  /* ⚙️ PWA INSTALL */
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = $("#install-btn");
    btn.hidden = false;
    btn.onclick = async () => {
      btn.hidden = true;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    };
  });
  window.addEventListener("appinstalled", () => alert("✅ LBizzo installed!"));
});
