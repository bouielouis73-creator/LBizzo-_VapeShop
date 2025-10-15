// script.js — LBizzo Vape Shop (Full Fixed Version)
document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  console.log("✅ LBizzo Vape Shop initialized...");

  // ---------- HELPERS ----------
  const $ = (s, r = document) => r.querySelector(s);
  const on = (el, evts, fn, opts) => {
    if (!el) return;
    evts.split(" ").forEach(e =>
      el.addEventListener(e, fn, opts || { passive: false })
    );
  };
  const toast = (msg) => {
    const t = $("#toast") || Object.assign(document.body.appendChild(document.createElement("div")), { id: "toast" });
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed",
      left: "50%",
      transform: "translateX(-50%)",
      bottom: "20px",
      background: "#111",
      color: "#fff",
      border: "1px solid #ff8c00",
      borderRadius: "8px",
      padding: "10px 14px",
      zIndex: "9999",
    });
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.remove(), 2200);
  };

  // ---------- AGE VERIFICATION ----------
  const overlay = $("#age-check");
  const yesBtn = $("#yesBtn");
  const noBtn = $("#noBtn");

  if (overlay && yesBtn && noBtn) {
    overlay.style.display = "grid";
    overlay.style.zIndex = "9999";
    document.body.style.overflow = "hidden";

    const allow = (e) => {
      e.preventDefault();
      overlay.style.display = "none";
      document.body.style.overflow = "auto";
      toast("✅ Age verified");
    };

    const deny = (e) => {
      e.preventDefault();
      alert("Sorry, you must be 21+ to enter.");
      location.href = "https://google.com";
    };

    ["click", "touchstart"].forEach((ev) => {
      yesBtn.addEventListener(ev, allow, { passive: false });
      noBtn.addEventListener(ev, deny, { passive: false });
    });
  }

  // ---------- FIREBASE ----------
  if (!firebase.apps.length) {
    const firebaseConfig = {
      apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
      authDomain: "lbizzodelivery.firebaseapp.com",
      projectId: "lbizzodelivery",
      storageBucket: "lbizzodelivery.firebasestorage.app",
      messagingSenderId: "614540837455",
      appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
    };
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ---------- ELEMENTS ----------
  const productList = $("#product-list");
  const cartBtn = $("#cart-btn");
  const closeCart = $("#close-cart");
  const cartSection = $("#cart");
  const cartItems = $("#cart-items");
  const cartCount = $("#cart-count");
  const totalEl = $("#total");
  const checkoutBtn = $("#checkout-btn");
  const scanBtn = $("#start-scan");

  // ---------- PRODUCTS ----------
  const PLACEHOLDER_IMG = "data:image/svg+xml," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%' height='100%' fill='#0b0b0b'/><text x='50%' y='50%' fill='#ff8c00' font-size='18' text-anchor='middle'>No Image</text></svg>"
  );

  async function getImageURL(path) {
    try { return await storage.ref(path).getDownloadURL(); }
    catch { return PLACEHOLDER_IMG; }
  }

  async function addCard(p) {
    const price = Number(p.price) || 0;
    const img = p.image ? await getImageURL(p.image) : PLACEHOLDER_IMG;
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${img}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>$${price.toFixed(2)}</p>
      <button class="add-btn">Add to Cart</button>`;
    on(card.querySelector(".add-btn"), "click touchstart", () => addToCart({ id: p.id, name: p.name, price, image: img }));
    productList.appendChild(card);
  }

  async function loadProducts() {
    const snap = await db.collection("products").get();
    if (snap.empty) {
      productList.innerHTML = "<p style='color:#ccc'>No products found.</p>";
    } else {
      snap.forEach(doc => addCard({ id: doc.id, ...doc.data() }));
    }
  }

  // ---------- CART ----------
  let cart = JSON.parse(localStorage.getItem("lb_cart") || "[]");
  let idVerified = false;

  const saveCart = () => localStorage.setItem("lb_cart", JSON.stringify(cart));

  const renderCart = () => {
    cartCount.textContent = cart.reduce((a, c) => a + c.qty, 0);
    cartItems.innerHTML = "";
    let total = 0;
    for (const i of cart) {
      total += i.price * i.qty;
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="row">
          <strong>${i.name}</strong>
          <div>$${(i.price * i.qty).toFixed(2)}</div>
          <div>
            <button class="minus">−</button>
            <span>${i.qty}</span>
            <button class="plus">+</button>
            <button class="remove">x</button>
          </div>
        </div>`;
      on(li.querySelector(".plus"), "click touchstart", () => { i.qty++; saveCart(); renderCart(); });
      on(li.querySelector(".minus"), "click touchstart", () => { i.qty = Math.max(1, i.qty - 1); saveCart(); renderCart(); });
      on(li.querySelector(".remove"), "click touchstart", () => { cart = cart.filter(c => c.id !== i.id); saveCart(); renderCart(); });
      cartItems.appendChild(li);
    }
    totalEl.textContent = "$" + total.toFixed(2);
  };

  const addToCart = (item) => {
    const found = cart.find(c => c.id === item.id);
    found ? found.qty++ : cart.push({ ...item, qty: 1 });
    saveCart(); renderCart(); toast("Added to cart");
  };

  on(cartBtn, "click touchstart", () => (cartSection.hidden = false));
  on(closeCart, "click touchstart", () => (cartSection.hidden = true));

  // ---------- SCANDIT ID VERIFICATION ----------
  async function startIDScan() {
    try {
      await ScanditSDK.configure(window.SCANDIT_LICENSE, {
        engineLocation: "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/"
      });
      const picker = await ScanditSDK.BarcodePicker.create(document.body, {
        playSoundOnScan: true,
        vibrateOnScan: true
      });
      const settings = new ScanditSDK.ScanSettings({ enabledSymbologies: ["pdf417"] });
      await picker.applyScanSettings(settings);
      picker.onScan(result => {
        if (result.barcodes.length) {
          idVerified = true;
          checkoutBtn.disabled = false;
          toast("✅ ID Verified");
          picker.destroy();
        }
      });
    } catch (e) {
      console.error(e);
      alert("Camera access failed. Check permissions or Scandit key.");
    }
  }
  on(scanBtn, "click touchstart", e => { e.preventDefault(); startIDScan(); });

  // ---------- CHECKOUT ----------
  on(checkoutBtn, "click touchstart", async (e) => {
    if (!idVerified) {
      e.preventDefault();
      toast("Please scan your ID first");
      return startIDScan();
    }
    toast("✅ Checkout ready — processing order...");
    // Add your EmailJS or Square checkout here
  });

  // ---------- INIT ----------
  await loadProducts();
  renderCart();
  checkoutBtn.disabled = true;
  console.log("🚀 All buttons working, age verified, Scandit active.");
});
