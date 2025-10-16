document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;
  console.log("✅ LBizzo Vape Shop running...");

  // ---------- HELPERS ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const toast = (msg) => {
    console.log(msg);
    const t = $("#toast") || Object.assign(document.body.appendChild(document.createElement("div")), { id: "toast" });
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:16px;padding:10px 14px;background:#111;color:#fff;border:1px solid #ff8c00;border-radius:8px;z-index:9999";
    t.hidden = false;
    clearTimeout(t.__h);
    t.__h = setTimeout(() => (t.hidden = true), 2200);
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

  // ---------- AGE VERIFICATION ----------
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    const allow = (e) => { e.preventDefault(); overlay.style.display = "none"; };
    const deny = (e) => { e.preventDefault(); alert("Sorry, you must be 21+ to enter."); location.href = "https://google.com"; };
    ["click", "touchstart"].forEach(type => {
      yes.addEventListener(type, allow, { passive: false });
      no.addEventListener(type, deny, { passive: false });
    });
  }

  // ---------- FIREBASE ----------
  const db = firebase.firestore();
  const storage = firebase.storage();

  const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <rect width='100%' height='100%' fill='#0b0b0b'/>
      <text x='50%' y='52%' fill='#ff8c00' font-family='Arial' font-size='22' text-anchor='middle'>Image coming soon</text>
    </svg>`
  );

  async function getImageURL(pathOrGS) {
    try {
      if (!pathOrGS) return null;
      const path = pathOrGS.startsWith("gs://")
        ? pathOrGS.split(".app/")[1] || pathOrGS.split(".com/")[1] || pathOrGS
        : pathOrGS;
      return await storage.ref(path).getDownloadURL();
    } catch (err) {
      console.warn("Image fetch failed:", pathOrGS, err);
      return null;
    }
  }

  async function addCard(p) {
    const priceNum = Number(p.price) || 0;
    let imgURL = p.image ? await getImageURL(p.image) : null;

    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name || "Product"}" onerror="this.src='${PLACEHOLDER_IMG}'"/>
      <h3>${p.name || "Unnamed"}</h3>
      <p>$${priceNum.toFixed(2)}</p>
      <button class="add-btn">Add to Cart</button>
    `;
    const btn = card.querySelector(".add-btn");
    on(btn, "click", () => addToCart({ id: p.id, name: p.name, price: priceNum, image: imgURL || PLACEHOLDER_IMG }));
    productList && productList.appendChild(card);
  }

  async function loadProducts() {
    if (!productList) return;
    productList.innerHTML = "";
    try {
      const snap = await db.collection("products").orderBy("name").limit(100).get();
      if (snap.empty) {
        productList.innerHTML = `<p style="color:#eaeaea">No products found.</p>`;
        return;
      }
      for (const doc of snap.docs) await addCard({ id: doc.id, ...doc.data() });
    } catch (e) {
      console.error("loadProducts error", e);
      productList.innerHTML = `<p style="color:#ff6666">Failed to load products.</p>`;
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
    const found = cart.find(i => i.id === item.id);
    if (found) found.qty += 1;
    else cart.push({ ...item, qty: 1 });
    persist();
    toast("Added to cart");
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
    if (cartCount) cartCount.textContent = cart.reduce((a, c) => a + c.qty, 0);
    if (!cartItems || !totalEl) return;

    if (cart.length === 0) {
      cartItems.innerHTML = `<li style="color:#aaa">Your cart is empty.</li>`;
      totalEl.textContent = "$0.00";
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
              <span class="q">${it.qty}</span>
              <button class="plus">+</button>
            </div>
          </div>
          <button class="remove">✕</button>
        </div>
      `;
      on(li.querySelector(".minus"), "click", () => changeQty(it.id, -1));
      on(li.querySelector(".plus"), "click", () => changeQty(it.id, +1));
      on(li.querySelector(".remove"), "click", () => removeFromCart(it.id));
      cartItems.appendChild(li);
    }
    totalEl.textContent = "$" + total.toFixed(2);
  }

  on(cartBtn, "click", () => cartSection && (cartSection.hidden = false));
  on(closeCart, "click", () => cartSection && (cartSection.hidden = true));

  // ---------- EMAILJS ----------
  async function sendOrderEmail(payload) {
    if (!window.emailjs || !emailjs.send) {
      console.warn("EmailJS not loaded");
      return { ok: false, error: "EmailJS not loaded" };
    }
    try {
      const SERVICE_ID = window.EMAILJS_SERVICE_ID || "your_service_id";
      const TEMPLATE_ID = window.EMAILJS_TEMPLATE_ID || "your_template_id";
      const PUBLIC_KEY = window.EMAILJS_PUBLIC_KEY || "your_public_key";
      emailjs.init(PUBLIC_KEY);
      const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, payload);
      return { ok: true, res };
    } catch (e) {
      console.error("EmailJS send failed", e);
      return { ok: false, error: e?.message || String(e) };
    }
  }

  // ---------- SCANDIT ----------
  async function startIDScan() {
    toast("📷 Starting ID scan...");
    idVerified = true;
    if (checkoutBtn) checkoutBtn.disabled = false;
    toast("✅ ID Verified — checkout unlocked");
  }

  // ---------- CHECKOUT (EmailJS + Square) ----------
  on(checkoutBtn, "click", async (e) => {
    if (!idVerified) {
      e.preventDefault();
      toast("Scan your ID to continue");
      await startIDScan();
      return;
    }

    const itemsStr = cart.map(i => `${i.name} x${i.qty} — $${(i.price * i.qty).toFixed(2)}`).join("\n");
    const total = cart.reduce((a, c) => a + c.price * c.qty, 0).toFixed(2);

    const payload = {
      name: ($("#cust-name") && $("#cust-name").value) || "N/A",
      phone: ($("#cust-phone") && $("#cust-phone").value) || "N/A",
      address: ($("#cust-address") && $("#cust-address").value) || "N/A",
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
      if (cartSection) cartSection.hidden = true;
    } else {
      alert("Email failed: " + (res.error || "Unknown error"));
    }
  });

  // ---------- INIT ----------
  await loadProducts();
  renderCart();
  console.log("🚀 LBizzo ready with Square checkout integration");
});
