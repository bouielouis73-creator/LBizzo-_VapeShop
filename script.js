// -------------------- CONFIG --------------------
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.appspot.com",   // ✅ fixed bucket
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
};

// EmailJS setup
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

// Square checkout link
const SQUARE_CHECKOUT_URL = "https://square.link/u/YOUR_CHECKOUT_LINK";

// Firestore collection name
const PRODUCTS_COLLECTION = "products";

// Placeholder image
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <rect width='100%' height='100%' fill='#0b0b0b'/>
      <text x='50%' y='50%' fill='#ff8c00' text-anchor='middle' font-size='20' font-family='Arial'>No Image</text>
    </svg>`
  );

// -------------------- MAIN --------------------
document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  console.log("✅ LBizzo Vape Shop running...");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt = (n) => `$${(Number(n) || 0).toFixed(2)}`;

  // Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const storage = firebase.storage();

  // EmailJS
  if (window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY);

  // ---------- AGE GATE ----------
  const overlay = $("#age-check");
  const yes = $("#yesBtn");
  const no = $("#noBtn");
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    yes.onclick = () => (overlay.style.display = "none");
    no.onclick = () => {
      alert("Sorry, you must be 21+ to enter.");
      window.location.href = "https://google.com";
    };
  }

  // ---------- SOUND ----------
  let audioCtx = null;
  function beep() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "square";
      o.frequency.value = 880;
      g.gain.value = 0.03;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      setTimeout(() => o.stop(), 120);
    } catch {}
  }

  // ---------- ELEMENTS ----------
  const productList = $("#product-list");
  const cartBtn = $("#cart-btn");
  const cartCount = $("#cart-count");
  const cartSection = $("#cart");
  const cartItems = $("#cart-items");
  const totalEl = $("#total");
  const closeCart = $("#close-cart");
  const checkoutBtn = $("#checkout-btn");
  const keepShopping = $("#keep-shopping");

  // ID verify
  const frontInput = $("#front-input");
  const backInput = $("#back-input");
  const frontPreview = $("#front-preview");
  const backPreview = $("#back-preview");
  const verifyBtn = $("#verify-id-btn");
  const verifyStatus = $("#verify-status");
  const idBox = $("#id-photo-box");

  // ---------- CART ----------
  const cart = {
    items: [],
    add(p) {
      const f = this.items.find((i) => i.id === p.id);
      if (f) f.qty++;
      else this.items.push({ ...p, qty: 1 });
      this.render();
      beep();
    },
    remove(id) {
      const i = this.items.find((x) => x.id === id);
      if (!i) return;
      i.qty--;
      if (i.qty <= 0) this.items = this.items.filter((x) => x.id !== id);
      this.render();
    },
    total() {
      return this.items.reduce((a, b) => a + (Number(b.price) || 0) * b.qty, 0);
    },
    render() {
      cartItems.innerHTML = "";
      this.items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;flex:1;overflow:hidden;">
            <img src="${item.image || PLACEHOLDER_IMG}" style="width:46px;height:46px;border-radius:8px;object-fit:cover;background:#000"/>
            <div style="flex:1;overflow:hidden;">
              <div>${item.name}</div>
              <div class="small muted">${fmt(item.price)} × ${item.qty}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn danger" data-dec="${item.id}">−</button>
            <button class="btn btn-primary" data-inc="${item.id}">＋</button>
          </div>`;
        cartItems.appendChild(row);
      });
      totalEl.textContent = fmt(this.total());
      cartCount.textContent = String(this.items.reduce((a, b) => a + b.qty, 0));
      refreshCheckoutAvailability();
      $$("#cart-items [data-dec]").forEach((b) => b.addEventListener("click", () => this.remove(b.dataset.dec)));
      $$("#cart-items [data-inc]").forEach((b) => b.addEventListener("click", () => this.add(this.items.find((i) => i.id === b.dataset.inc))));
    },
  };

  cartBtn.onclick = () => (cartSection.style.display = "grid");
  closeCart.onclick = () => (cartSection.style.display = "none");
  keepShopping.onclick = () => (cartSection.style.display = "none");

  // ---------- PRODUCTS ----------
  async function getImageURL(path) {
    try {
      return await storage.ref(path).getDownloadURL();
    } catch (e) {
      console.warn("⚠️ Missing or restricted image:", path);
      return null;
    }
  }

  async function addCard(doc) {
    const p = doc.data();
    const id = doc.id;
    const imgURL = p.image ? await getImageURL(p.image) : null;
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name || "Product"}" />
      <h3>${p.name || "Unnamed"}</h3>
      <p>$${(p.price || 0).toFixed(2)}</p>
      <button class="add-btn">Add to Cart</button>`;
    productList.appendChild(card);
    const prod = { id, name: p.name || "Unnamed", price: p.price || 0, image: imgURL };
    card.querySelector(".add-btn").onclick = () => cart.add(prod);
  }

  async function loadProducts() {
    try {
      const snap = await db.collection(PRODUCTS_COLLECTION).get();
      if (snap.empty) {
        productList.innerHTML = "<p style='text-align:center;color:#ff8c00'>No products found.</p>";
        return;
      }
      for (const doc of snap.docs) await addCard(doc);
    } catch (e) {
      console.error(e);
    }
  }
  await loadProducts();

  // ---------- ID FLOW ----------
  let frontBase64 = null;
  let backBase64 = null;
  let idVerified = false;

  function refreshCheckoutAvailability() {
    checkoutBtn.disabled = !(idVerified && cart.items.length > 0);
  }

  async function fileToBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function handleFile(input, preview, setter) {
    const f = input.files && input.files[0];
    if (!f) return;
    const b64 = await fileToBase64(f);
    setter(b64);
    preview.src = b64;
    preview.style.display = "block";
    verifyBtn.disabled = !(frontBase64 && backBase64);
  }

  frontInput.onchange = () => handleFile(frontInput, frontPreview, (v) => (frontBase64 = v));
  backInput.onchange = () => handleFile(backInput, backPreview, (v) => (backBase64 = v));

  verifyBtn.onclick = async () => {
    verifyBtn.disabled = true;
    verifyStatus.textContent = "Verifying your ID...";
    try {
      const resp = await fetch("/.netlify/functions/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: frontBase64, back: backBase64 }),
      }).catch((err) => {
        console.error(err);
        verifyStatus.textContent = "❌ Could not reach verification server.";
      });
      if (!resp) return;
      const data = await resp.json();
      if (data.verified) {
        idVerified = true;
        verifyStatus.textContent = `✅ Verified: ${data.name || "ID ok"} (DOB ${data.dob || "—"})`;
        beep();
        // ✅ Go straight to Square checkout
        window.location.href = SQUARE_CHECKOUT_URL;
      } else {
        verifyStatus.textContent = "❌ ID could not be verified.";
      }
    } catch (e) {
      console.error(e);
      verifyStatus.textContent = "❌ Verification failed.";
    } finally {
      verifyBtn.disabled = false;
      refreshCheckoutAvailability();
    }
  };

  // ---------- CHECKOUT ----------
  checkoutBtn.onclick = async () => {
    if (!idVerified) {
      alert("Verify your ID first.");
      return;
    }
    if (!cart.items.length) return;

    const itemsText = cart.items.map((i) => `${i.name} x${i.qty} — ${fmt(i.price * i.qty)}`).join("\n");
    const payload = {
      name: "LBizzo Customer",
      items: itemsText,
      total: fmt(cart.total()),
    };
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
      window.location.href = SQUARE_CHECKOUT_URL;
    } catch (e) {
      console.error(e);
      alert("❌ Email or checkout failed.");
    }
  };

  cart.render();
});
