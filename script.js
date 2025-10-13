// ---------- SCANDIT SDK INITIALIZATION + IMAGE VERIFY ----------
(async () => {
  try {
    console.log("⏳ Loading Scandit SDK...");
    await ScanditSDK.configure(
      "AjeGjTUcEtL1CJWakqGDsHUqNSa2FUaEfgpehFQktDUvftJypGR1uUk4YOe9U57HnWknn6FAegM/Wa/Oul2VLYxdP6h8QNRpqnO6VYQmJrB/Fz8zCSq5ZxMO4g1dbz/yk0KhxtRmyOJUQZ3lPHPLmXRItF4heDTY2040ZyZ7hODuQ7g+6kYMgmRVn8G+Fv5waQ/MN/Rf7YmZYFPd7GGlg5Ry5dTxavIgUWA4H6dGZVnSUvih0lpLVZJ++O79R7YSL2CNET10lSNXXNySjEJ7o31fUt9aeyI1YmqYgLdMSQsDVEBqp3K+OEdPPAg1Qwrrb3S+c7ti7TGoQDhPAExRC61b3frNUhmU80Csg/Rr9GecBDyIbmFEGz52LPQ1a0vT2RpSouZ9gfC0YbTZpEwDNXha9vBcckqEUUeggFAakLpyVRj8231A8bd3emXvehAJRHGhqZNQEJWVeFq31B7mofwKdElOXyEFCSmAgGlY/hq9VPmkt3F4w9UNbPT8YGE5JW4v5JNu6TofHrsdVyEqKQIJNCUKDuNNKQrzA0ESIq/x/gNdCr/PbIjzx7i0L8yeYXuolP1vzJdIvhJvvt8vifaFwtftAmWCUj4GlFBq0e22RwYI7to1tt1IJ3llMZeAP6s6RreABtf8ZpeMyJd9Cw2VF2+7ZWrTNS0j2GqUH78Bt3CYOjli8Bg4YBrlKHjKFYo7jL49/b+4tN3BvSXJbn/7CK+AZ6PjYBKBmuQqQUUwotp7Gvd/0sjt3H7OWrAQb3n8mYK8u6WmJjuLIKQKSt6YoqfPviaj8N7ThlEter9fCXdlhqWDIIiBU0AXbn/jlCEVmhtvSUcXEh2QhNPaig8sLBrjtXnZQh/JNz2x9Xn49PMKUP0C/qia+HS09dfmKgNUDU0ikax1oVu7GlZPrIWhF5R41jZI60TqRMgx5Z4Q4k8oaEw0GLenxOJDxs9ehoPEY634tjJ+NV+8eU9VtOYtiQ5+5WJkf1yMZGtrdpo15xjZZHOjJwusEnEdzoXW1woDQDMrsQn1OnAG6VlALE73S15l9kPSZ1NDknDDitiRlxe1XIn3P7wFwG80QMQY58vTJ1rCdUF2mzg11LbTy/1YZyyn65CjsSGqWQLQrW9z3GoRR7+h35tBltE49sR7+JNR4U+e7qwb52bAQoWa0DLxsiswAAUjZcGevTCpWQvvxwhOqjCNcD/7Fxkpfc5NVvM=",
      { engineLocation: "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/" }
    );
    await ScanditSDK.ready();
    console.log("✅ Scandit SDK ready");
  } catch (e) {
    console.error("❌ Scandit SDK failed to initialize:", e);
  }
})();

// ---------- PHOTO ID VERIFICATION (NEW FEATURE) ----------
async function verifyIDPhoto(file) {
  try {
    if (!window.ScanditSDK || !ScanditSDK.BarcodeScanner) {
      alert("⚠️ Scandit not ready yet, please wait a few seconds.");
      return false;
    }

    const imageBuffer = await file.arrayBuffer();
    const imageData = new Uint8Array(imageBuffer);
    const result = await ScanditSDK.BarcodeScanner.scanImage(imageData, {
      enabledSymbologies: ["pdf417"],
    });

    if (!result.barcodes.length) {
      alert("❌ No barcode detected. Please retake the photo.");
      document.dispatchEvent(new Event("id-reset"));
      return false;
    }

    const codeText = result.barcodes[0].data;
    console.log("📸 Scanned from photo:", codeText);

    const dobMatch = codeText.match(/DBB(\d{8})/);
    const hasHeader = /^@?ANSI ?\d{6} ?\d{2}/.test(codeText) || /AAMVA/i.test(codeText);
    if (!hasHeader || !dobMatch) {
      alert("⚠️ Not a valid driver’s license image. Please try again.");
      document.dispatchEvent(new Event("id-reset"));
      return false;
    }

    const dob = dobMatch[1];
    const year = +dob.slice(0, 4);
    const month = +dob.slice(4, 6) - 1;
    const day = +dob.slice(6, 8);
    const birth = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

    if (age >= 21) {
      alert(`✅ ID verified. Age: ${age}`);
      window.ID_VERIFIED = true;
      document.dispatchEvent(new Event("id-verified"));
      return true;
    } else {
      alert(`🚫 Under 21 (Age: ${age})`);
      window.ID_VERIFIED = false;
      document.dispatchEvent(new Event("id-reset"));
      return false;
    }
  } catch (err) {
    console.error("❌ Image verification failed:", err);
    alert("⚠️ Could not verify ID. Try again.");
    document.dispatchEvent(new Event("id-reset"));
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("idPhotoInput");
  if (input) {
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) await verifyIDPhoto(file);
    });
  }
});

// ---------- MAIN APP ----------
document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo JS booting...");

  // ---------- EMAILJS INIT ----------
  try {
    if (window.emailjs) {
      emailjs.init("jUx6gEqKI1tvL7yLs");
      console.log("✅ EmailJS initialized");
    }
  } catch (err) {
    console.error("❌ EmailJS init error:", err);
  }

  const SQUARE_BASE = "https://square.link/u/GOvQxhqG";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const on = (sel, ev, fn) => {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (el) el.addEventListener(ev, fn);
  };

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
    if (!Number.isNaN(i)) {
      cart.splice(i, 1);
      updateCartUI();
    }
  });

  async function sendOrderEmail(orderData) {
    try {
      const response = await emailjs.send("service_bk310ht", "template_sb8tg8bk", orderData);
      alert("📧 Order sent successfully to LBizzo!");
    } catch (err) {
      alert("⚠️ There was a problem sending your order.");
    }
  }

  const stars = $$("#loyalty-stars .star");
  let loyalty = parseInt(localStorage.getItem("loyaltyCount") || "0", 10);
  const renderStars = () => stars.forEach((s, i) => s.classList.toggle("active", i < loyalty));
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

  let ID_VERIFIED = false;
  window.ID_VERIFIED = false;

  (function lockCheckout() {
    if (!checkoutBtn) return;
    checkoutBtn.disabled = true;
    document.addEventListener("id-verified", () => { checkoutBtn.disabled = false; });
    document.addEventListener("id-reset", () => { checkoutBtn.disabled = true; });
  })();

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

    await sendOrderEmail(orderData);
    addLoyaltyStar();
    cart = [];
    updateCartUI();

    const totalCents = Math.round(parseFloat(total) * 100);
    const checkoutURL = `${SQUARE_BASE}?amount=${totalCents}`;
    window.open(checkoutURL, "_blank");
  });

  updateCartUI();

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
    const imgURL = p.image && !/^https?:\/\//i.test(p.image)
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
      productList.innerHTML = "";
      for (const doc of snap.docs) await addCard(doc.data());
    } catch {
      for (let i = 1; i <= 50; i++)
        await addCard({ name: `LBizzo Placeholder #${i}`, price: 0 });
    }
  }

  await loadProducts();

  // ---------- LIVE SCANDIT SCANNER ----------
  const scanStart = $("#scanStart");
  const scanStop = $("#scanStop");
  const scanOut = $("#scanOut");
  let scanner = null;

  on(scanStart, "click", async () => {
    try {
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

      scanner.on("scan", (res) => {
        const codeText = res.barcodes.map((b) => b.data).join("\n");
        const matchDOB = codeText.match(/DBB(\d{8})/);
        if (!matchDOB) {
          scanOut.textContent = "⚠️ Invalid ID barcode.";
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
        if (
          today.getMonth() < birth.getMonth() ||
          (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
        )
          age--;

        if (age >= 21) {
          scanOut.textContent = `✅ Verified (Age ${age})`;
          window.ID_VERIFIED = true;
          document.dispatchEvent(new Event("id-verified"));
        } else {
          scanOut.textContent = `🚫 Under 21 (Age ${age})`;
          window.ID_VERIFIED = false;
          document.dispatchEvent(new Event("id-reset"));
        }
      });
    } catch (err) {
      scanOut.textContent = "❌ Scanner error: " + err.message;
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
});

// ---------- SERVICE WORKER ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
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
window.addEventListener("appinstalled", () => alert("✅ LBizzo Vape Shop installed!"));
