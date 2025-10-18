(() => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  // ======= CONSTANTS =======
  const COLLECTION = "products";
  const STORAGE_FOLDER = "products";
  const SQUARE_LINK = "https://square.link/u/GTlYqlIK";

  // ======= EMAILJS =======
  document.addEventListener("DOMContentLoaded", () => {
    if (window.emailjs && !window.__EMAILJS_INIT__) {
      emailjs.init("jUx6gEqKI1tvL7yLs"); // Your Public Key
      window.__EMAILJS_INIT__ = true;
    }
  });

  // ======= HELPERS =======
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = n => Number(n || 0).toFixed(2);

  const beep = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.03;
    o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 100);
  };

  // ======= AGE GATE =======
  const ageOverlay = $("#age-check");
  $("#yesBtn")?.addEventListener("click", e => {
    e.preventDefault(); ageOverlay.style.display = "none";
  });
  $("#noBtn")?.addEventListener("click", e => {
    e.preventDefault(); alert("Sorry, you must be 21+ to enter."); location.href = "https://google.com";
  });
  if (ageOverlay) ageOverlay.style.display = "grid";

  // ======= PWA =======
  let deferredPrompt = null;
  const installBtn = $("#install-btn");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferredPrompt = e; installBtn.hidden = false;
  });
  installBtn?.addEventListener("click", async () => {
    deferredPrompt.prompt(); await deferredPrompt.userChoice;
    installBtn.hidden = true; deferredPrompt = null;
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");

  // ======= LOYALTY =======
  const starsWrap = $("#stars");
  const getStars = () => Number(localStorage.getItem("lb_stars") || 0);
  const setStars = n => localStorage.setItem("lb_stars", String(n));
  const renderStars = () => {
    const n = getStars(); starsWrap.innerHTML = "";
    for (let i=1;i<=6;i++){
      const el = document.createElement("div");
      el.className = "star" + (i<=n ? " active":"");
      el.textContent = "★";
      starsWrap.appendChild(el);
    }
  };
  renderStars();

  // ======= PRODUCTS =======
  const productList = $("#product-list");
  const emptyProducts = $("#empty-products");

  // ⚙️ Accepts full URL or relative path automatically
  const getImageURL = async (path) => {
    try {
      if (!path) return null;
      if (/^https?:\/\//i.test(path)) return path; // full URL case
      const ref = storage.ref(path);
      return await ref.getDownloadURL(); // relative path case
    } catch {
      return null;
    }
  };

  const addCard = async (p, id) => {
    const imgURL = await getImageURL(p.image);
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL || ""}" alt="${p.name || ""}" />
      <h3>${p.name || "Unnamed"}</h3>
      <p>$${fmt(p.price)}</p>
      <button class="btn add">Add to Cart</button>
    `;
    card.querySelector(".add").addEventListener("click", () => {
      addToCart({ id, name: p.name, price: Number(p.price)||0, image: p.image });
      beep();
    });
    productList.appendChild(card);
  };

  const loadProducts = async () => {
    try {
      const snap = await db.collection(COLLECTION).get();
      if (snap.empty) { emptyProducts.hidden = false; return; }
      emptyProducts.hidden = true; productList.innerHTML = "";
      for (const doc of snap.docs) await addCard(doc.data(), doc.id);
    } catch (e) { console.error("Product load failed:", e); emptyProducts.hidden = false; }
  };
  loadProducts();

  // ======= CART =======
  const cartBtn = $("#cart-btn"), cartCount = $("#cart-count");
  const cartDrawer = $("#cart"), closeCart = $("#close-cart");
  const keepShopping = $("#keep-shopping"), clearCartBtn = $("#clear-cart");
  const cartItems = $("#cart-items"), totalEl = $("#total");

  let cart = JSON.parse(localStorage.getItem("lb_cart") || "[]");
  const saveCart = () => localStorage.setItem("lb_cart", JSON.stringify(cart));
  const syncCount = () => cartCount.textContent = String(cart.reduce((a,c)=>a+c.qty,0));
  const total = () => cart.reduce((a,c)=>a + c.price*c.qty, 0);

  const renderCart = async () => {
    cartItems.innerHTML = "";
    for (const item of cart) {
      const url = await getImageURL(item.image);
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${url || ""}" alt="">
        <div><h4>${item.name}</h4><div class="muted">$${fmt(item.price)} × ${item.qty}</div></div>
        <div>
          <button class="btn ghost minus">−</button>
          <button class="btn ghost plus">+</button>
          <button class="btn ghost remove">🗑</button>
        </div>`;
      row.querySelector(".minus").onclick = () => { item.qty=Math.max(1,item.qty-1); saveCart(); renderCart(); syncCount();};
      row.querySelector(".plus").onclick  = () => { item.qty++; saveCart(); renderCart(); syncCount();};
      row.querySelector(".remove").onclick= () => { cart=cart.filter(c=>c!==item); saveCart(); renderCart(); syncCount();};
      cartItems.appendChild(row);
    }
    totalEl.textContent = fmt(total());
  };

  const addToCart = (p) => {
    const existing = cart.find(c => c.id===p.id);
    if (existing) existing.qty++; else cart.push({...p, qty:1});
    saveCart(); syncCount();
  };

  cartBtn?.addEventListener("click", () => {
    cartDrawer.classList.add("open"); renderCart();
  });
  closeCart?.addEventListener("click", () => cartDrawer.classList.remove("open"));
  keepShopping?.addEventListener("click", () => cartDrawer.classList.remove("open"));
  clearCartBtn?.addEventListener("click", () => { cart=[]; saveCart(); renderCart(); syncCount(); });
  syncCount();

  // ======= ID / CHECKOUT =======
  const idForm = $("#id-form"), idFront = $("#idFront"), idBack = $("#idBack");
  const orderItems = $("#orderItems"), orderTotal = $("#orderTotal");
  const itemsText = () => cart.map(c => `• ${c.name} — $${fmt(c.price)} x ${c.qty} = $${fmt(c.price*c.qty)}`).join("\n");

  idForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cart.length) return alert("Cart is empty.");
    if (!idFront.files?.length || !idBack.files?.length) return alert("Please upload both front and back of your ID.");
    orderItems.value = itemsText(); orderTotal.value = fmt(total());
    try {
      await emailjs.sendForm("service_7o2u4kq", "template_6jlkofi", idForm);
      let s = getStars() + 1; if (s >= 6) { alert("🎉 6 stars! 1 free vape next time."); s = 0; }
      setStars(s); renderStars();
      window.location.href = SQUARE_LINK;
    } catch (err) {
      console.error(err); alert("EmailJS send failed. Please try again.");
    }
  });

})();
