// LBizzo Vape Shop — EmailJS + Firebase (no Twilio) + PWA registration
(() => {
  if (window.__LBIZZO_BOOTED__) return; window.__LBIZZO_BOOTED__ = true;
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  console.log("✅ LBizzo booting (EmailJS + PWA)…");

  // ---- EmailJS ----
  const EMAILJS_PUBLIC_KEY   = "f05G0OWo8vkel_HXz";
  const EMAILJS_SERVICE_ID   = "Services_mos7x3m";
  const EMAILJS_TEMPLATE_ID  = "Template_kw9vt5f";
  const EMAIL_TO             = "lbizzocustomers@outlook.com"; // used as `to_email`

  document.addEventListener("DOMContentLoaded", () => {
    if (window.emailjs && EMAILJS_PUBLIC_KEY) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      console.log("📧 EmailJS ready");
    } else {
      console.warn("⚠️ EmailJS not initialized — check your public key");
    }
  });

  // ---- UI Elements ----
  const ageGate      = $("#age-check");
  const yesBtn       = $("#yesBtn");
  const noBtn        = $("#noBtn");
  const listEl       = $("#product-list");
  const search       = $("#search");
  const cartBtn      = $("#cart-btn");
  const cartDrawer   = $("#cart");
  const closeCartBtn = $("#close-cart");
  const cartItemsEl  = $("#cart-items");
  const cartCountEl  = $("#cart-count");

  const subtotalEl   = $("#subtotal");
  const taxEl        = $("#tax");
  const totalEl      = $("#order_total");

  const form         = $("#checkout-form");
  const nameEl       = $("#cust_name");
  const addrEl       = $("#cust_address");
  const phoneEl      = $("#cust_phone");
  $("#year").textContent = new Date().getFullYear();

  // ---- Age Gate ----
  yesBtn.addEventListener("click", () => ageGate.style.display = "none");
  noBtn.addEventListener("click", () => {
    alert("Sorry — you must be 21+ to enter.");
    location.href = "https://www.responsibility.org/";
  });

  // ---- Placeholder image (SVG data URI) ----
  const PLACEHOLDER = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A//www.w3.org/2000/svg'%20width%3D'400'%20height%3D'400'%3E%3Crect%20width%3D'100%25'%20height%3D'100%25'%20fill%3D'black'/%3E%3Crect%20x%3D'30'%20y%3D'30'%20width%3D'340'%20height%3D'340'%20rx%3D'18'%20fill%3D'%23111'%20stroke%3D'%23ff8c00'%20stroke-width%3D'6'/%3E%3Ctext%20x%3D'50%25'%20y%3D'52%25'%20dominant-baseline%3D'middle'%20text-anchor%3D'middle'%20font-family%3D'Arial'%20font-size%3D'28'%20fill%3D'%23ff8c00'%3ELBizzo%20Product%3C/text%3E%3C/svg%3E";

  // ---- State ----
  let products = [];
  let cart = []; // { id, name, price, img, qty }

  // ---- Firestore helpers ----
  const col = () => db.collection(window.LBIZZO_COLLECTION || "products");

  async function loadProducts() {
    const snap = await col().get();
    if (snap.empty) {
      console.log("No products found — seeding 50 placeholders…");
      const batch = db.batch();
      for (let i=1; i<=50; i++) {
        const ref = col().doc();
        const price = (Math.random()*25 + 4).toFixed(2);
        batch.set(ref, {
          name: `Placeholder #${i}`,
          description: "Add real products in Firestore → products",
          price: Number(price),
          img: PLACEHOLDER
        });
      }
      await batch.commit();
      const seeded = await col().get();
      products = seeded.docs.map(d => ({ id:d.id, ...d.data() }));
    } else {
      products = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    }
    renderProducts(products);
  }

  function renderProducts(list) {
    listEl.innerHTML = "";
    for (const p of list) {
      const card = document.createElement("article"); card.className = "card";

      const imgWrap = document.createElement("div"); imgWrap.className = "img";
      const img = document.createElement("img"); img.alt = p.name || "Product image"; img.loading = "lazy"; img.src = p.img || PLACEHOLDER;
      imgWrap.appendChild(img);

      const meta = document.createElement("div"); meta.className = "meta";
      const title = document.createElement("div"); title.className = "title"; title.textContent = p.name || "Unnamed Product";
      const price = document.createElement("div"); price.className = "price"; price.textContent = "$" + Number(p.price||0).toFixed(2);

      const actions = document.createElement("div"); actions.className = "actions";
      const addBtn = document.createElement("button"); addBtn.className = "btn primary"; addBtn.textContent = "Add to Cart";
      addBtn.addEventListener("click", () => addToCart(p));
      actions.appendChild(addBtn);

      meta.append(title, price, actions);
      card.append(imgWrap, meta);
      listEl.appendChild(card);
    }
  }

  // ---- Search ----
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    if (!q) return renderProducts(products);
    const result = products.filter(p => (p.name||"").toLowerCase().includes(q));
    renderProducts(result);
  });

  // ---- Cart logic ----
  function addToCart(p) {
    const found = cart.find(i => i.id === p.id);
    if (found) found.qty += 1;
    else cart.push({ id:p.id, name:p.name, price:Number(p.price||0), img:p.img||PLACEHOLDER, qty:1 });
    drawCart(); openCart();
  }

  function changeQty(id, delta) {
    const item = cart.find(i => i.id === id); if (!item) return;
    item.qty += delta; if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    drawCart();
  }

  function drawCart() {
    cartItemsEl.innerHTML = "";
    let subtotal = 0;

    for (const i of cart) {
      const li = document.createElement("li"); li.className = "cart-item";

      const im = document.createElement("img"); im.src = i.img;

      const info = document.createElement("div");
      const name = document.createElement("div"); name.className = "name"; name.textContent = i.name;
      const qty = document.createElement("div"); qty.className = "qty";
      const minus = document.createElement("button"); minus.textContent = "−"; minus.addEventListener("click", () => changeQty(i.id, -1));
      const q = document.createElement("span"); q.textContent = i.qty;
      const plus = document.createElement("button"); plus.textContent = "+"; plus.addEventListener("click", () => changeQty(i.id, +1));
      qty.append(minus, q, plus); info.append(name, qty);

      const price = document.createElement("div"); price.textContent = "$" + (i.price * i.qty).toFixed(2);

      li.append(im, info, price); cartItemsEl.appendChild(li);
      subtotal += i.price * i.qty;
    }

    cartCountEl.textContent = cart.reduce((a,b)=>a+b.qty,0);
    subtotalEl.textContent = "$" + subtotal.toFixed(2);
    const tax = +(subtotal * 0.06).toFixed(2);
    taxEl.textContent = "$" + tax.toFixed(2);
    totalEl.textContent = "$" + (subtotal + tax).toFixed(2);
  }

  function openCart(){ cartDrawer.classList.add("open"); cartDrawer.setAttribute("aria-hidden","false"); }
  function closeCart(){ cartDrawer.classList.remove("open"); cartDrawer.setAttribute("aria-hidden","true"); }
  cartBtn.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);

  // ---- Checkout (EmailJS) ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!window.emailjs) return alert("EmailJS not loaded");
    if (!cart.length) return alert("Your cart is empty");

    const order_items = cart.map(i => `${i.qty} x ${i.name} ($${i.price.toFixed(2)})`).join(", ");
    const order_total = totalEl.textContent.replace("$","");

    const params = {
      to_email: EMAIL_TO,
      cust_name: nameEl.value.trim(),
      cust_address: addrEl.value.trim(),
      cust_phone: phoneEl.value.trim(),
      order_items,
      order_total
    };

    try {
      const res = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
      console.log("EmailJS sent:", res.status);
      alert("✅ Order sent! We will contact you shortly.");
      cart = []; drawCart(); form.reset(); closeCart();
    } catch(err) {
      console.error(err);
      alert("❌ Failed to send order. Check EmailJS keys/service/template + template variables.");
    }
  });

  // ---- Init ----
  loadProducts().catch(err => console.error(err));

  // ---- PWA: register service worker ----
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js")
        .then(() => console.log("🧩 Service Worker registered"))
        .catch(err => console.log("SW fail:", err));
    });
  }
})();
