<script>
document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const debugBar = $("#debug");
  const debug = (msg, ok=false) => {
    if (!debugBar) return;
    debugBar.textContent = msg;
    debugBar.style.background = ok ? "#022" : "#220";
    debugBar.style.color = ok ? "#91ffcf" : "#ff8c8c";
    debugBar.hidden = false;
    console.log(msg);
  };

  // ---------- Elements ----------
  const overlay = $("#age-check");
  const yes = $("#yesBtn");
  const no = $("#noBtn");

  const productList = $("#product-list");

  const cartBtn = $("#cart-btn");
  const cartDrawer = $("#cart");
  const closeCart = $("#close-cart");
  const keepShopping = $("#keep-shopping");
  const cartItems = $("#cart-items");
  const totalEl = $("#total");
  const cartCount = $("#cart-count");
  const checkoutBtn = $("#checkout-btn");
  const checkoutTip = $("#checkout-tip");

  const scanSection = $("#id-scan-section");
  const scanOpen = $("#scan-open");
  const scanClose = $("#scan-close");
  const scanStart = $("#scan-start");
  const scanStop = $("#scan-stop");
  const scanStatus = $("#scan-status");
  const scanArrow = $("#scan-arrow");
  const scanView = $("#scan-view");

  // ---------- Sounds ----------
  const clickSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3"); // small click

  // ---------- State ----------
  const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>
      <rect width='100%' height='100%' fill='#0a0a0a'/>
      <text x='50%' y='52%' font-size='28' fill='#444' text-anchor='middle' font-family='Arial'>Image</text>
    </svg>
  `);

  let cart = [];
  let verified = false;

  // ---------- Age gate ----------
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    const allow = (e) => { e.preventDefault(); overlay.style.display = "none"; };
    const deny  = (e) => { e.preventDefault(); alert("Sorry, you must be 21+ to enter."); window.location.href = "https://google.com"; };
    ["click","touchstart"].forEach(ev => {
      yes.addEventListener(ev, allow, {passive:false});
      no.addEventListener(ev,  deny,  {passive:false});
    });
  }

  // ---------- EmailJS init ----------
  // Replace with your actual public key (you said it changed)
  try { emailjs.init({ publicKey: "YOUR_EMAILJS_PUBLIC_KEY" }); } catch(e){ console.warn(e); }

  // ---------- Products (Firestore 'products' collection) ----------
  async function loadProducts() {
    productList.innerHTML = "";
    try {
      const snap = await db.collection("products").orderBy("name").get();
      if (snap.empty) {
        productList.innerHTML = `<p class="muted">No products yet. Add docs in Firestore “products” with fields: <code>name</code>, <code>price</code>, <code>image</code> (Storage path like <code>products/yourfile.jpg</code>).</p>`;
        return;
      }
      snap.forEach(doc => addCard({ id: doc.id, ...doc.data() }));
    } catch (e) {
      debug("Load products error: " + e.message);
    }
  }

  async function addCard(p) {
    const card = document.createElement("div");
    card.className = "product";

    const priceNum = Number(p.price) || 0;
    const url = await window.getStorageURL(p.image);
    const imgSrc = url || PLACEHOLDER_IMG;

    card.innerHTML = `
      <div class="img-wrap"><img src="${imgSrc}" alt="${p.name || "Product"}" /></div>
      <h3>${p.name || "Unnamed"}</h3>
      <p>$${priceNum.toFixed(2)}</p>
      <button class="add-btn">Add to Cart</button>
    `;
    card.querySelector(".add-btn").addEventListener("click", () => {
      clickSound.currentTime = 0; clickSound.play().catch(()=>{});
      addToCart({ id: p.id, name: p.name || "Item", price: priceNum, image: imgSrc });
    });
    productList.appendChild(card);
  }

  // ---------- Cart ----------
  function openCart(){ cartDrawer.hidden = false; }
  function closeCartDrawer(){ cartDrawer.hidden = true; }
  cartBtn?.addEventListener("click", openCart);
  closeCart?.addEventListener("click", closeCartDrawer);
  keepShopping?.addEventListener("click", closeCartDrawer);

  function addToCart(item){
    const found = cart.find(i => i.id === item.id);
    if (found) found.qty += 1; else cart.push({...item, qty:1});
    renderCart();
  }
  function removeFromCart(id){
    cart = cart.filter(i => i.id !== id);
    renderCart();
  }
  function changeQty(id, delta){
    const it = cart.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(1, it.qty + delta);
    renderCart();
  }
  function renderCart(){
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach(i => {
      const row = document.createElement("div");
      row.className = "cart-item";
      total += i.price * i.qty;
      row.innerHTML = `
        <img src="${i.image}" alt="${i.name}">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;gap:8px;">
            <strong>${i.name}</strong>
            <span>$${(i.price * i.qty).toFixed(2)}</span>
          </div>
          <div class="row" style="margin-top:6px">
            <button class="icon-btn" data-d="-1">−</button>
            <span>${i.qty}</span>
            <button class="icon-btn" data-d="1">＋</button>
            <button class="icon-btn" data-remove>Remove</button>
          </div>
        </div>
      `;
      row.querySelector("[data-d='-1']").onclick = ()=>changeQty(i.id,-1);
      row.querySelector("[data-d='1']").onclick  = ()=>changeQty(i.id, 1);
      row.querySelector("[data-remove']").onclick = ()=>removeFromCart(i.id);
      cartItems.appendChild(row);
    });
    totalEl.textContent = "$" + total.toFixed(2);
    cartCount.textContent = String(cart.reduce((n,i)=>n+i.qty,0));

    // Lock checkout until ID verified
    checkoutBtn.disabled = !verified || total === 0;
    checkoutTip.textContent = verified ? "ID verified — you can checkout." : "Checkout unlocks after ID is verified.";
  }

  // ---------- Checkout (Square + EmailJS) ----------
  const SQUARE_LINK = "https://square.link/u/GTlYqlIK"; // your link
  async function sendOrderEmail(payload){
    // Create an EmailJS template with variables: name, phone, address, items, total
    try {
      const resp = await emailjs.send(
        "YOUR_EMAILJS_SERVICE_ID",
        "YOUR_EMAILJS_TEMPLATE_ID",
        payload
      );
      console.log("EmailJS OK:", resp);
      return true;
    } catch (e) {
      console.warn("EmailJS error:", e);
      return false;
    }
  }

  checkoutBtn?.addEventListener("click", async () => {
    if (!verified) return alert("Please verify your ID first.");
    if (!cart.length) return;

    // Collect a quick modal-style prompt (simple)
    const name = prompt("Name for the order:");
    if (!name) return;
    const phone = prompt("Phone:");
    const address = prompt("Address:");
    const itemsStr = cart.map(i => `${i.qty} x ${i.name} @ $${i.price.toFixed(2)}`).join("\n");
    const totalStr = totalEl.textContent.replace("$","");

    await sendOrderEmail({ name, phone, address, items: itemsStr, total: totalStr });

    // Redirect to Square checkout
    window.location.href = SQUARE_LINK;
  });

  // ---------- Scandit Setup (Live Scan) ----------
  const SCANDIT_LICENSE_KEY = "YOUR_SCANDIT_LICENSE_KEY_HERE"; // paste your real key

  let context = null;
  let barcodeCapture = null;
  let camera = null;
  let view = null;

  async function initScandit() {
    try {
      if (!window.Scandit || !window.Scandit.DataCaptureContext) {
        debug("Scandit not loaded yet. Check network/CDN.", false);
        return;
      }

      const SDC = Scandit;
      context = await SDC.DataCaptureContext.create(SCANDIT_LICENSE_KEY);

      // Camera
      camera = SDC.Camera.default;
      await context.setFrameSource(camera);

      // Settings: enable PDF417 (driver license)
      const settings = new SDC.BarcodeCaptureSettings();
      settings.enableSymbologies([SDC.Symbology.PDF417]);

      barcodeCapture = await SDC.BarcodeCapture.forContext(context, settings);

      barcodeCapture.addListener({
        didScan: (ctrl, session) => {
          const code = session.newlyRecognizedBarcodes[0];
          if (code) {
            verified = true;
            renderCart();
            scanArrow.classList.add("verified");
            scanStatus.textContent = "Verified ✔";
            scanStatus.style.color = "var(--ok)";
            debug("ID verified via PDF417", true);
            // optional: stop after success
            stopCamera();
          }
        }
      });

      // View overlay
      view = await SDC.DataCaptureView.forContext(context);
      view.connectToElement(scanView);
      const overlay = await SDC.BarcodeCaptureOverlay.withBarcodeCaptureForView(barcodeCapture, view);
      overlay.viewfinder = new SDC.RectangularViewfinder();

      debug("Scandit initialized", true);
    } catch (e) {
      debug("Scandit init error: " + e.message);
    }
  }

  async function startCamera(){
    try {
      if (!context) await initScandit();
      if (!camera || !barcodeCapture) return debug("Camera not ready", false);
      await camera.switchToDesiredState(Scandit.FrameSourceState.On);
      barcodeCapture.isEnabled = true;
      scanStatus.textContent = verified ? "Verified ✔" : "Scanning…";
      debug("Camera started", true);
    } catch (e) {
      debug("Start camera error: " + e.message);
    }
  }
  async function stopCamera(){
    try {
      if (barcodeCapture) barcodeCapture.isEnabled = false;
      if (camera) await camera.switchToDesiredState(Scandit.FrameSourceState.Off);
      debug("Camera stopped", true);
    } catch (e) {
      debug("Stop camera error: " + e.message);
    }
  }

  // Scan UI events
  scanOpen?.addEventListener("click", () => { scanSection.hidden = false; });
  scanClose?.addEventListener("click", () => { scanSection.hidden = true; });
  scanStart?.addEventListener("click", startCamera);
  scanStop?.addEventListener("click", stopCamera);

  // ---------- Boot ----------
  await loadProducts();
  renderCart();
  debug("LBizzo ready", true);
});
</script>
