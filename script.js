document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO__) return;
  window.__LBIZZO__ = true;

  // ====== CONFIG ======
  const EMAILJS_PUBLIC_KEY = "jUx6gEqKI1tvL7yLs";
  const EMAILJS_SERVICE_ID = "service_7o2u4kq";
  const EMAILJS_TEMPLATE_ID = "template_6jlkofi";
  const SCANDIT_LICENSE_KEY = "AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDR";
  const SQUARE_CHECKOUT_URL = "https://square.link/u/GTlYqlIK";

  // ====== HELPERS ======
  const $  = (s, r=document) => r.querySelector(s);
  const fmt = n => `$${(Number(n)||0).toFixed(2)}`;
  const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <rect width='100%' height='100%' fill='#0b0b0b'/>
      <text x='50%' y='54%' text-anchor='middle' fill='#555' font-size='20'>image</text>
    </svg>`
  );
  const debug = (m, ok=false) => { const d=$("#debug"); if(d){d.hidden=false; d.textContent=m; d.style.background=ok?"#022":"#220"; d.style.color=ok?"#7fffb3":"#ff8c8c";} };

  // ====== ELEMENTS ======
  const overlay=$("#age-check"), yes=$("#yesBtn"), no=$("#noBtn");

  const scanSection=$("#id-scan-section");
  const scannerHost=$("#scanner-host"), scannerView=$("#scanner-view");
  const stopScanBtn=$("#stop-scan");
  const fallbackWrap=$("#photo-fallback");
  const idFront=$("#id-front"), idBack=$("#id-back"), markVerified=$("#mark-verified");
  const verifyDot=$("#verify-dot"), verifyStatus=$("#verify-status");

  const productList=$("#product-list");

  const cartBtn=$("#cart-btn"), cart=$("#cart"), closeCart=$("#close-cart");
  const cartItems=$("#cart-items"), totalEl=$("#total"), cartCount=$("#cart-count");
  const checkoutBtn=$("#checkout-btn"), checkoutNote=$("#checkout-note"), checkoutStatus=$("#checkout-status");
  const nameInput=$("#cust-name"), phoneInput=$("#cust-phone"), addrInput=$("#cust-address");

  // ====== STATE ======
  let idVerified=false, cartArr=[];
  let scandit = { loaded:false, camera:null, context:null, view:null, capture:null };

  // ====== EMAILJS INIT ======
  try { emailjs.init(EMAILJS_PUBLIC_KEY); debug("EmailJS ready", true); } catch(e){ debug("EmailJS init failed"); }

  // ====== AGE GATE (→ show products) ======
  overlay.style.display="grid";
  yes.addEventListener("click", (e)=>{
    e.preventDefault();
    overlay.style.display="none";       // allow browsing
    scanSection.classList.add("hidden"); // no scan yet
    debug("Age verified — browsing unlocked", true);
  });
  no.addEventListener("click", (e)=>{
    e.preventDefault();
    alert("Sorry, you must be 21+ to enter.");
    location.href="https://google.com";
  });

  // ====== SCANDIT (PDF417 on IDs) ======
  async function startScan() {
    // show fallback first; enable live scanner if SDK is available
    fallbackWrap.classList.remove("hidden");
    scannerHost.classList.add("hidden");

    if (!window.Scandit) {
      debug("Scandit SDK not loaded — using photo fallback.");
      return;
    }

    try {
      const SD = window.Scandit;
      const ctx = await SD.DataCaptureContext.create(SCANDIT_LICENSE_KEY);
      const camera = SD.Camera.default;
      await ctx.setFrameSource(camera);

      const settings = new SD.barcodes.BarcodeCaptureSettings();
      settings.setSymbologyEnabled(SD.barcodes.Symbology.PDF417, true);

      const capture = await SD.barcodes.BarcodeCapture.forContext(ctx, settings);
      capture.isEnabled = true;

      const view = await SD.ui.DataCaptureView.create(ctx, scannerView);
      await SD.barcodes.BarcodeCaptureOverlay.withBarcodeCaptureForView(capture, view);

      capture.addListener({
        didScan: (_, session) => {
          const code = session.newlyRecognizedBarcodes?.[0];
          if (!code) return;
          onVerified("scan");
          stopScan();
        }
      });

      scannerHost.classList.remove("hidden");
      fallbackWrap.classList.add("hidden");

      await camera.switchToDesiredState(SD.CameraState.On);
      scandit = { loaded:true, camera, context:ctx, view, capture };
      debug("Scanner ready", true);
    } catch (e) {
      console.error(e);
      debug("Scan failed — fallback mode", false);
      scannerHost.classList.add("hidden");
      fallbackWrap.classList.remove("hidden");
    }
  }

  async function stopScan(){
    try{
      if (scandit.capture) scandit.capture.isEnabled = false;
      if (scandit.camera) await scandit.camera.switchToDesiredState(window.Scandit.CameraState.Off);
      if (scandit.context) await scandit.context.dispose();
    }catch{}
    scannerHost.classList.add("hidden");
    fallbackWrap.classList.remove("hidden");
  }
  stopScanBtn.addEventListener("click", stopScan);

  function onVerified(mode){
    idVerified = true;
    verifyDot.classList.remove("pulse");
    verifyDot.style.background = "var(--ok)";
    verifyStatus.textContent = "Verified ✓";
    checkoutBtn.disabled = false;
    checkoutNote.textContent = "ID verified. You can checkout now.";
    debug(`ID verified via ${mode}`, true);
  }

  markVerified.addEventListener("click", ()=>{
    if (!idFront.files[0] || !idBack.files[0]) { alert("Please upload front and back of your ID first."); return; }
    onVerified("photo");
  });

  // ====== FIREBASE PRODUCTS ======
  async function getImageURL(path){
    if(!path) return null;
    try { return await storage.ref(path).getDownloadURL(); }
    catch(e){ console.warn("Storage getDownloadURL failed:", path, e); return null; }
  }

  async function loadProducts(){
    productList.innerHTML = "";
    try{
      const snap = await db.collection("products").get(); // lowercase 'products'
      if (snap.empty){
        productList.innerHTML = `<p class="muted">No products yet. Add docs to Firestore “products”.</p>`;
        return;
      }
      for (const doc of snap.docs){
        const p = { id: doc.id, ...doc.data() };
        const priceNum = Number(p.price)||0;
        const url = p.image ? await getImageURL(p.image) : null;

        const card = document.createElement("div");
        card.className = "product";
        card.innerHTML = `
          <img src="${url || PLACEHOLDER}" alt="${p.name||''}" onerror="this.src='${PLACEHOLDER}'" />
          <div class="pad">
            <h3>${p.name||'Unnamed'}</h3>
            <p>${fmt(priceNum)}</p>
            <button class="btn add-btn">Add to Cart</button>
          </div>
        `;
        card.querySelector(".add-btn").addEventListener("click", ()=>addToCart({id:p.id, name:p.name||"Unnamed", price:priceNum, imageURL:url}));
        productList.appendChild(card);
      }
      debug("Products loaded", true);
    }catch(e){
      console.error(e);
      debug("Failed to load products (check Firestore rules/collection).");
    }
  }

  // ====== CART ======
  function beep(){
    try{
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type="square"; o.frequency.value=650; g.gain.value=0.02;
      o.connect(g); g.connect(ctx.destination); o.start();
      setTimeout(()=>{o.stop();ctx.close();},120);
    }catch{}
  }
  function addToCart(p){
    const i = cartArr.findIndex(x=>x.id===p.id);
    if (i>=0) cartArr[i].qty += 1; else cartArr.push({...p, qty:1});
    renderCart(); beep();
  }
  function changeQty(id, d){
    const it = cartArr.find(x=>x.id===id); if(!it) return;
    it.qty += d; if (it.qty<=0) cartArr = cartArr.filter(x=>x.id!==id);
    renderCart();
  }
  function cartTotal(){ return cartArr.reduce((s,i)=>s+(Number(i.price)||0)*i.qty,0); }
  function renderCart(){
    cartItems.innerHTML = "";
    cartArr.forEach(it=>{
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${it.imageURL || PLACEHOLDER}" alt="${it.name}">
        <div>
          <div><strong>${it.name}</strong></div>
          <div class="muted small">${fmt(it.price)}</div>
          <div class="qty">
            <button aria-label="decrease">-</button>
            <span>${it.qty}</span>
            <button aria-label="increase">+</button>
          </div>
        </div>
        <button class="icon-btn" aria-label="remove">🗑</button>
      `;
      const [dec,,inc] = row.querySelectorAll(".qty button");
      const rm = row.querySelector(".icon-btn");
      dec.addEventListener("click", ()=>changeQty(it.id,-1));
      inc.addEventListener("click", ()=>changeQty(it.id,+1));
      rm.addEventListener("click", ()=>{ cartArr = cartArr.filter(x=>x.id!==it.id); renderCart(); });
      cartItems.appendChild(row);
    });
    totalEl.textContent = fmt(cartTotal());
    cartCount.textContent = String(cartArr.reduce((s,i)=>s+i.qty,0));
  }

  cartBtn.addEventListener("click", ()=>cart.classList.remove("hidden"));
  closeCart.addEventListener("click", ()=>cart.classList.add("hidden"));

  // ====== CHECKOUT (Flow: Ask for ID → after verified: Square → Email) ======
  checkoutBtn.addEventListener("click", async ()=>{
    // If not verified, open the scanner step first
    if (!idVerified) {
      cart.classList.add("hidden");
      scanSection.classList.remove("hidden");
      await startScan();
      return;
    }

    if (cartArr.length===0){ alert("Your cart is empty."); return; }

    const name = (nameInput.value||"").trim();
    const phone = (phoneInput.value||"").trim();
    const address = (addrInput.value||"").trim();
    if (!name || !phone || !address){
      alert("Please enter name, phone, and address.");
      return;
    }

    const items = cartArr.map(i=>`${i.name} x${i.qty} — ${fmt((Number(i.price)||0)*i.qty)}`).join("\n");
    const total = fmt(cartTotal());

    // Your order email will be sent AFTER opening Square (as you requested).
    // We open Square in a new tab to not block the email send.
    window.open(SQUARE_CHECKOUT_URL, "_blank");

    checkoutStatus.textContent = "Sending order details…";
    try{
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        name,
        phone,
        address,
        items,
        total,
        to_email: "lbizzocustomers@outlook.com"
      });
      checkoutStatus.textContent = "Order email sent ✔";
      cartArr = []; renderCart(); cart.classList.add("hidden");
    }catch(e){
      console.error(e);
      checkoutStatus.textContent = "Email failed. Check EmailJS keys/template.";
      alert("Email failed. Recheck EmailJS settings.");
    }
  });

  // ====== INIT ======
  await loadProducts();
});
