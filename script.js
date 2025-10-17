document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO__) return;
  window.__LBIZZO__ = true;

  // ====== YOUR REAL KEYS ======
  const EMAILJS_PUBLIC_KEY = "jUx6gEqKI1tvL7yLs";
  const EMAILJS_SERVICE_ID = "service_7o2u4kq";
  const EMAILJS_TEMPLATE_ID = "template_6jlkofi";
  const SCANDIT_LICENSE_KEY = "AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRdDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDR";

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
  try { emailjs.init(EMAILJS_PUBLIC_KEY); debug("EmailJS ready", true); } catch(e){ debug("EmailJS failed to init"); }

  // ====== AGE GATE ======
  overlay.style.display="grid";
  yes.addEventListener("click", async (e)=>{
    e.preventDefault();
    overlay.style.display="none";
    scanSection.classList.remove("hidden");
    await startScan(); // auto start scan after "Yes"
  });
  no.addEventListener("click", (e)=>{
    e.preventDefault();
    alert("Sorry, you must be 21+ to enter.");
    location.href="https://google.com";
  });

  // ====== SCANDIT (PDF417 barcode on IDs) ======
  async function startScan() {
    // show fallback first; enable live scanner if SDK is available
    fallbackWrap.classList.remove("hidden");
    scannerHost.classList.add("hidden");

    if (!window.Scandit) { debug("Scandit not available. Using photo fallback."); return; }

    try {
      const SD = window.Scandit;
      const ctx = await SD.DataCaptureContext.create(SCANDIT_LICENSE_KEY);
      const camera = SD.Camera.default;
      await ctx.setFrameSource(camera);

      // PDF417 is the barcode used on most driver's licenses
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
          debug(`ID barcode scanned: ${String(code.data).slice(0,12)}…`, true);
          onVerified("scan");
          stopScan();
        }
      });

      scannerHost.classList.remove("hidden");
      fallbackWrap.classList.add("hidden");

      await camera.switchToDesiredState(SD.CameraState.On);
      scandit = { loaded:true, camera, context:ctx, view, capture };
      debug("Scanner running…", true);
    } catch (e) {
      console.error(e);
      debug("Scanner failed — photo fallback mode", false);
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
    if (!idFront.files[0] || !idBack.files[0]) { alert("Please upload front and back of your ID."); return; }
    onVerified("photo");
  });

  // ====== PRODUCTS (Firestore + Storage) ======
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
      debug("Failed to load products (check Firestore rules/collection name).");
    }
  }

  // ====== CART (all buttons wired) ======
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

  // ====== CHECKOUT (EmailJS) ======
  checkoutBtn.addEventListener("click", async ()=>{
    if (!idVerified){ alert("Please verify your ID first."); return; }
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

    checkoutStatus.textContent = "Sending order…";
    try{
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { name, phone, address, items, total });
      checkoutStatus.textContent = "Order sent ✔ Check your email.";
      cartArr = []; renderCart(); cart.classList.add("hidden");
    }catch(e){
      console.error(e);
      checkoutStatus.textContent = "Email failed. Check EmailJS keys/template.";
      alert("Email failed. Recheck EmailJS Public Key / Service / Template IDs.");
    }
  });

  // ====== INIT ======
  await loadProducts(); // products visible even before verifying
});
