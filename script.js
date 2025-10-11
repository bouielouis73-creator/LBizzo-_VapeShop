document.addEventListener("DOMContentLoaded", () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo JS booting…");

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const debugBar = $("#debug");
  const debug = (msg, ok=false) => {
    if (!debugBar) return;
    debugBar.textContent = msg;
    debugBar.style.background = ok ? "#022" : "#220";
    debugBar.style.color = ok ? "#7fffb3" : "#ff6666";
    debugBar.hidden = false;
  };

  // ---------- age check (robust: won't crash if elements missing) ----------
  const ageCheck = $("#age-check");
  on($("#yesBtn"), "click", () => ageCheck && (ageCheck.style.display = "none"));
  on($("#noBtn"),  "click", () => { alert("Sorry, you must be 21 or older to enter."); location.href="https://google.com"; });

  // ---------- cart ----------
  const cartBtn = $("#cart-btn");
  const cartList = $("#cart-items");
  const cartCount = $("#cart-count");
  const totalEl = $("#cart-total");
  const checkoutBtn = $("#checkout-btn");

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  function updateCartUI() {
    if (!cartList) return;
    cartList.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
      total += Number(item.price) || 0;
      const li = document.createElement("li");
      li.innerHTML = `${item.name} - $${(Number(item.price)||0).toFixed(2)}
        <button class="remove" data-i="${i}">❌</button>`;
      cartList.appendChild(li);
    });
    if (totalEl) totalEl.textContent = `Total: $${total.toFixed(2)}`;
    if (cartCount) cartCount.textContent = cart.length;
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

  on(checkoutBtn, "click", () => {
    if (!cart.length) { alert("Your cart is empty!"); return; }
    alert("🛒 Checkout complete!");
    addLoyaltyStar();
    cart = [];
    updateCartUI();
  });

  updateCartUI();

  // ---------- loyalty stars ----------
  const stars = document.querySelectorAll("#loyalty-stars .star");
  let loyaltyCount = parseInt(localStorage.getItem("loyaltyCount") || "0", 10);
  function renderStars(){ stars.forEach((s,i)=> s.classList.toggle("active", i < loyaltyCount)); }
  function addLoyaltyStar(){
    loyaltyCount++;
    if (loyaltyCount >= 6) { alert("🎉 Congratulations! You earned a free vape!"); loyaltyCount = 0; }
    localStorage.setItem("loyaltyCount", String(loyaltyCount));
    renderStars();
  }
  renderStars();

  // ---------- products ----------
  const productList = $("#product-list");
  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='480' height='360'><rect width='100%' height='100%' fill='%23111'/><rect x='12' y='12' width='456' height='336' rx='18' fill='black' stroke='%23ff8c00' stroke-width='6'/><text x='50%25' y='55%25' text-anchor='middle' font-family='Arial' font-size='42' fill='%23ff8c00'>LBizzo</text></svg>";

  function addCard(p) {
    const priceNum = Number(p.price) || 0;
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${p.image || PLACEHOLDER_IMG}" alt="${p.name || 'Product'}"
           onerror="this.src='${PLACEHOLDER_IMG}';" />
      <h3>${p.name || "Unnamed"}</h3>
      <p>$${priceNum.toFixed(2)}</p>
      <button class="add-btn">Add to Cart</button>
    `;
    card.querySelector(".add-btn").addEventListener("click", () => {
      cart.push({ name: p.name || "Item", price: priceNum, image: p.image || "" });
      updateCartUI();
    });
    productList.appendChild(card);
  }

  function loadDemoProducts() {
    debug("Using demo products (Firestore not available or empty).");
    productList.innerHTML = "";
    [
      { name:"LBizzo Mango Ice", price:12.99 },
      { name:"LBizzo Blue Razz", price:13.49 },
      { name:"LBizzo Strawberry", price:11.99 },
      { name:"LBizzo Watermelon", price:14.25 },
      { name:"LBizzo Grape Ice", price:12.49 },
      { name:"LBizzo Peach", price:13.75 }
    ].forEach(addCard);
  }

  // Try Firestore first; fall back to demo
  (async () => {
    try {
      if (!window.db || !firebase) { loadDemoProducts(); return; }
      const snap = await db.collection("products").get();
      if (!snap || snap.empty) { debug("Connected to Firestore • 0 product(s). Showing demo.", true); loadDemoProducts(); return; }
      debug(`Connected to Firestore • ${snap.size} product(s)`, true);
      productList.innerHTML = "";
      snap.forEach(doc => addCard(doc.data()));
    } catch (err) {
      console.error("🔥 Firestore load error:", err);
      debug(`Firestore error: ${err.message}`);
      loadDemoProducts();
    }
  })();
});
