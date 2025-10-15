// -------------------- CONFIG --------------------
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.firebasestorage.app",
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
};

// EmailJS (replace with your real keys)
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

// Square checkout link (change this to your real Square checkout URL)
const SQUARE_CHECKOUT_URL = "https://square.link/u/YOUR_CHECKOUT_LINK";

// Firestore collection & Storage folder
const PRODUCTS_COLLECTION = "products";
const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
     <rect width='100%' height='100%' fill='#0b0b0b'/>
     <text x='50%' y='50%' fill='#ff8c00' text-anchor='middle' font-size='20' font-family='Arial'>No Image</text>
   </svg>`
);

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  console.log("✅ LBizzo Vape Shop running...");

  // Helpers
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt = n => `$${(Number(n)||0).toFixed(2)}`;

  const debugBar = $("#debug");
  const debug = (msg, ok = false) => {
    if (!debugBar) return;
    debugBar.style.display = "block";
    debugBar.textContent = msg;
    debugBar.style.color = ok ? "#7fffb3" : "#ff8888";
  };

  // Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const storage = firebase.storage();

  // EmailJS
  if (window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY);

  // Simple beep sound
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
  const keepShopping = $("#keep-shopping");

  // ID elements
  const frontInput = $("#front-input");
  const backInput  = $("#back-input");
  const frontPreview = $("#front-preview");
  const backPreview  = $("#back-preview");
  const verifyBtn = $("#verify-id-btn");
  const verifyStatus = $("#verify-status");
  const idBox = $("#id-photo-box");

  // ---------- AGE GATE ----------
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    const allow = (e) => { e.preventDefault(); overlay.style.display = "none"; };
    const deny  = (e) => { e.preventDefault(); alert("Sorry, you must be 21+ to enter."); window.location.href = "https://google.com"; };
    ["click","touchstart"].forEach(evt=>{
      yes.addEventListener(evt,allow,{passive:false});
      no.addEventListener(evt,deny,{passive:false});
    });
  }

  // ---------- CART ----------
  const cart = {
    items: [],
    add(p) {
      const found = this.items.find(i => i.id === p.id);
      if (found) found.qty += 1; else this.items.push({ ...p, qty: 1 });
      this.render();
      beep();
    },
    remove(id) {
      const i = this.items.find(x => x.id === id);
      if (!i) return;
      i.qty -= 1;
      if (i.qty <= 0) this.items = this.items.filter(x => x.id !== id);
      this.render();
    },
    total() {
      return this.items.reduce((a, b) => a + (Number(b.price)||0) * b.qty, 0);
    },
    render() {
      cartItems.innerHTML = "";
      this.items.forEach(item => {
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px">
            <img src="${item.image || PLACEHOLDER_IMG}" alt="" style="width:46px;height:46px;object-fit:cover;border-radius:8px;background:#000"/>
            <div>
              <div>${item.name}</div>
              <div class="small muted">${fmt(item.price)} × ${item.qty}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <button class="btn danger" data-dec="${item.id}">−</button>
            <button class="btn btn-primary" data-inc="${item.id}">＋</button>
          </div>
        `;
        cartItems.appendChild(row);
      });
      totalEl.textContent = fmt(this.total());
      cartCount.textContent = String(this.items.reduce((a,b)=>a+b.qty,0));
      refreshCheckoutAvailability();
      $$("#cart-items [data-dec]").forEach(btn => btn.addEventListener("click", () => cart.remove(btn.dataset.dec)));
      $$("#cart-items [data-inc]").forEach(btn => btn.addEventListener("click", () => cart.add(cart.items.find(i=>i.id===btn.dataset.inc))));
    }
  };

  // ---------- UI ----------
  cartBtn.addEventListener("click", () => { cartSection.style.display = "grid"; });
  closeCart.addEventListener("click", () => { cartSection.style.display = "none"; });
  keepShopping.addEventListener("click", () => { cartSection.style.display = "none"; });

  // ---------- PRODUCTS ----------
  async function getImageURL(path) {
    try { return await storage.ref().child(path).getDownloadURL(); }
    catch { return null; }
  }

  async function addCard(doc) {
    const p = doc.data();
    const id = doc.id;
    const priceNum = Number(p.price) || 0;
    const imgURL = p.image ? await getImageURL(p.image) : null;
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name || "Product"}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <h3>${p.name || "Unnamed"}</h3>
      <p>${fmt(priceNum)}</p>
      <button class="add-btn">Add to Cart</button>
    `;
    productList.appendChild(card);
    const productObj = { id, name: p.name || "Unnamed", price: priceNum, image: imgURL };
    card.querySelector(".add-btn").addEventListener("click", () => cart.add(productObj));
  }

  async function loadProducts() {
    productList.innerHTML = "";
    try {
      const snap = await db.collection(PRODUCTS_COLLECTION).orderBy("name").get();
      if (snap.empty) {
        for (let i=1;i<=12;i++){
          const fake = document.createElement("div");
          fake.className = "product ghost";
          fake.innerHTML = `
            <img src="${PLACEHOLDER_IMG}" />
            <h3>Product #${i}</h3>
            <p>${fmt(9.99)}</p>
            <button class="add-btn" disabled>Add to Cart</button>`;
          productList.appendChild(fake);
        }
        debug("No Firestore products found in 'products' collection.", false);
        return;
      }
      snap.forEach(addCard);
    } catch (e) {
      console.error(e);
      debug("Failed to load products. Check Firestore rules.", false);
    }
  }
  await loadProducts();

  // ---------- LOYALTY ----------
  const stars = [$("#star1"),$("#star2"),$("#star3"),$("#star4"),$("#star5"),$("#star6")];
  function setStars(n){ stars.forEach((s,i)=> s.textContent = (i<n) ? "⭐" : "☆"); }
  let earned = Number(localStorage.getItem("lb_stars")||0);
  setStars(earned);

  // ---------- ID PHOTO FLOW ----------
  let frontBase64 = null;
  let backBase64  = null;
  let idVerified  = false;

  function refreshCheckoutAvailability(){
    checkoutBtn.disabled = !(idVerified && cart.items.length>0);
  }

  function updateVerifyButtonState(){
    verifyBtn.disabled = !(frontBase64 && backBase64);
    verifyStatus.textContent = verifyBtn.disabled
      ? "Add both images to enable verification."
      : "Ready to verify. We'll securely check your ID.";
  }

  async function fileToBase64(file){
    return new Promise((res,rej)=>{
      const r=new FileReader();
      r.onload=()=>res(r.result);
      r.onerror=rej;
      r.readAsDataURL(file);
    });
  }

  async function handleFile(inputEl, previewEl, setter){
    const f=inputEl.files&&inputEl.files[0];
    if(!f)return;
    const b64=await fileToBase64(f);
    setter(b64);
    previewEl.src=b64;
    previewEl.style.display="block";
    updateVerifyButtonState();
  }

  frontInput.addEventListener("change",()=>handleFile(frontInput,frontPreview,v=>frontBase64=v));
  backInput.addEventListener("change",()=>handleFile(backInput,backPreview,v=>backBase64=v));

  verifyBtn.addEventListener("click", async ()=>{
    verifyBtn.disabled=true;
    verifyStatus.textContent="Verifying your ID…";
    idBox.classList.remove("glow");

    try {
      const resp = await fetch("/.netlify/functions/verify-id", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ front: frontBase64, back: backBase64 })
      }).catch(err=>{
        console.error(err);
        verifyStatus.textContent="❌ Could not reach verification server.";
        idBox.classList.add("glow");
      });

      if(!resp) return;
      if(!resp.ok) throw new Error(`Server ${resp.status}`);
      const data = await resp.json();

      if(data && data.verified){
        idVerified=true;
        verifyStatus.textContent=`✅ Verified: ${data.name||"ID ok"} (DOB ${data.dob||"—"})`;
        beep();
      } else {
        idVerified=false;
        verifyStatus.textContent=`❌ Couldn't verify ID. ${data && data.message?data.message:""}`;
        idBox.classList.add("glow");
      }
    } catch(e){
      console.error(e);
      idVerified=false;
      verifyStatus.textContent="❌ Verification failed or offline.";
      idBox.classList.add("glow");
    } finally {
      verifyBtn.disabled=!(frontBase64&&backBase64);
      refreshCheckoutAvailability();
    }
  });

  idBox.classList.add("glow");

  // ---------- CHECKOUT ----------
  checkoutBtn.addEventListener("click", async ()=>{
    if(!idVerified){ alert("Please verify your ID before checkout."); return; }
    if(!cart.items.length) return;

    const itemsText = cart.items.map(i=>`${i.name} x${i.qty} — ${fmt(i.price*i.qty)}`).join("\n");
    const payload = {
      name: "LBizzo Customer",
      phone: "(unknown)",
      address: "(pickup or delivery)",
      items: itemsText,
      total: fmt(cart.total())
    };

    try{
      if(!window.emailjs) throw new Error("EmailJS missing");
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
      alert("Order confirmed! Redirecting to Square checkout...");
      earned=Math.min(6,earned+1);
      localStorage.setItem("lb_stars",String(earned));
      setStars(earned);
      cart.items=[];
      cart.render();
      cartSection.style.display="none";
      window.location.href = SQUARE_CHECKOUT_URL;
    }catch(e){
      console.error(e);
      alert("❌ Could not send order or open checkout. Try again.");
    }
  });

  cart.render();
});
