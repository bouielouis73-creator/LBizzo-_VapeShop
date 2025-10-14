// ------------------ LBizzo Vape Shop — script.js (All buttons fixed, Scandit auto-verify 21+) ------------------
if (window.__LBIZZO_BOOTED__) { console.warn("LBizzo already loaded."); }
else {
  window.__LBIZZO_BOOTED__ = true;

  // ---------- Helpers ----------
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const on = (el, evt, cb) => el && el.addEventListener(evt, cb);
  const debug = (msg, ok=false) => {
    const bar = $("#debug");
    if (!bar) return;
    bar.textContent = msg;
    bar.style.display = "block";
    bar.style.background = ok ? "#0c1a0c" : "#1a0c0c";
    bar.style.color = ok ? "#9ef1b0" : "#f19999";
  };

  // ---------- Firebase (lbizzodelivery) ----------
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.appspot.com",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
    databaseURL: "https://lbizzodelivery-default-rtdb.firebaseio.com"
  };
  try { firebase.initializeApp(firebaseConfig); } catch {}
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ---------- Keys (pre-filled from your screenshots; can be adjusted in Settings) ----------
  const KEYS = {
    public:  localStorage.getItem("emailjs_public")  || "jUx6gEqKI1tvL7yLs",
    service: localStorage.getItem("emailjs_service") || "service_bk310ht",
    template:localStorage.getItem("emailjs_template")|| "template_sbbt8blk",
    square:  localStorage.getItem("square_base")     || "https://square.link/u/n0DB9QR7Q",
    scandit: localStorage.getItem("scandit_key")     || `AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRdDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDRq/3pbdNQ2wHBxXMlLL1ubSkte/FG9MLxf7J9KQC5/jlqBwhtXC8O8amwpv0g1/Txo/v8tVBMqkxkYTEZ7AeUvXC9mb0GYDlt+RdXhQedpeU+YQxcj1zzQa+pYTlx1d5laJHh3WMjL1nKzEUZlZXZpUZbxASRzM48blxXef8EtyyVCnS5X2WyBWRUGEGVfjUIiawJRFrxu31ll5ghjcpeWHsJTdTrYUGgegsdXcz6jeB0jcg6cISpkQ+vfVYZ1Cz33hCdJIpjP6YdV1txoUHPQf/9KJkImFT6XFWj6khyUHtnZjDZyyApE4bWHuMZtDzghqN30nYaX47bZQbrSELMCguYjhVRrUaA4M1IBTHMjtwTlFNFSTups1/pUFPI4mNV8ZuKuRwANY9MO4STHjdCfX6CA/xjsbBbBc+b5N1N8E70TNlAUsov2sgisR7ICqNFXG+H93QFuKd3F6nVvY8DiYOZ+7HvY5KVBkIY2Fys70JRdPyRQeCpRdEmwzReb//77uF344Wt0UZmFXSNBAOEPJdDjRvAllzC7ZRtiGYiSbGlV9yDs6Ly6XF0miq2G3pZtiTCQqdYT2/R7M0ENi4qLYDnLbfFAiux3PI/AmUsOfbWRxnKARt2pWn0vFHIdgeswEMITqF2etKjPbjzy5LDs+YxXfF+D4h//svwIUeMuOAjunsNRs2ZUpzdMGAXzUTF/YEE/upE1tRmFrDAWDKzYpb9ouoKNNPDR9SgrwhcCKk+nXbpOhiWlkZjVmBr0edch/b/2ywfMtImPqq/CWix1RSlYHse85OSKKiXaGRp6FqhBccGh7h2FVOWvgVC75c7vJ+sOvksOxhLI8IR46aAnNDHatQwBjrHeIBBbNBNUKj2u34KXvvSvC6qM7FVWKUt1b5zu2rGc4NI=`
  };

  // Settings UI (tap title to toggle)
  const applyKeys = () => {
    const ep=$("#emailjsPublic"), es=$("#emailjsService"), et=$("#emailjsTemplate"), sq=$("#squareBase");
    if (ep) ep.value = KEYS.public;
    if (es) es.value = KEYS.service;
    if (et) et.value = KEYS.template;
    if (sq) sq.value = KEYS.square;
  };
  const saveKeys = () => {
    const ep=$("#emailjsPublic"), es=$("#emailjsService"), et=$("#emailjsTemplate"), sq=$("#squareBase");
    if (ep) KEYS.public  = ep.value.trim();
    if (es) KEYS.service = es.value.trim();
    if (et) KEYS.template= et.value.trim();
    if (sq) KEYS.square  = sq.value.trim();
    localStorage.setItem("emailjs_public",  KEYS.public);
    localStorage.setItem("emailjs_service", KEYS.service);
    localStorage.setItem("emailjs_template",KEYS.template);
    localStorage.setItem("square_base",     KEYS.square);
    try { if (window.emailjs && KEYS.public) emailjs.init({ publicKey: KEYS.public }); } catch {}
    debug("Settings saved.", true);
  };
  on($("#saveKeys"),"click",saveKeys);
  on($(".topbar h1"),"click",()=>{ const s=$("#settings"); if(!s)return; s.style.display=(s.style.display==="none"||!s.style.display)?"block":"none"; });
  window.addEventListener("load",()=>{ applyKeys(); try{ if(window.emailjs && KEYS.public) emailjs.init({ publicKey: KEYS.public }); }catch{} });

  // ---------- Age Check ----------
  const ageOverlay=$("#age-check");
  on($("#yesBtn"),"click",()=>{ if(ageOverlay) ageOverlay.style.display="none"; });
  on($("#noBtn"),"click",()=>{ alert("Sorry, you must be 21+ to enter."); location.href="https://google.com"; });
  window.addEventListener("load",()=>{ if(ageOverlay) ageOverlay.style.display="grid"; });

  // ---------- Products (Firestore `products` + Storage `/products/`) ----------
  const productList=$("#product-list");
  const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <rect width='100%' height='100%' fill='#0b0b0b'/>
      <rect x='16' y='16' width='368' height='268' rx='16' fill='#141414' stroke='#ff8c00' stroke-width='4'/>
      <text x='50%' y='55%' text-anchor='middle' font-size='28' fill='#ff8c00' font-family='Arial Black, Arial'>LBizzo</text>
    </svg>
  `);

  async function getImageURL(path){
    if(!path) return null;
    if(path.startsWith("http")) return path;
    // try exact (maybe already "products/…")
    try { return await storage.ref(path).getDownloadURL(); }
    catch {
      try { return await storage.ref(`products/${path}`).getDownloadURL(); }
      catch { console.warn("⚠️ Missing image:", path); return null; }
    }
  }
  async function addProductCard(p){
    if(!productList) return;
    const url = await getImageURL(p.image);
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${url||PLACEHOLDER_IMG}" alt="${p.name||"Product"}" onerror="this.src='${PLACEHOLDER_IMG}'"/>
      <h3>${p.name||"Unnamed"}</h3>
      <p>$${(Number(p.price)||0).toFixed(2)}</p>
      <button class="btn primary add">Add to Cart</button>
    `;
    on(card.querySelector(".add"),"click",()=>addToCart({id:p.id||p.name,name:p.name,price:Number(p.price)||0,image:p.image}));
    productList.appendChild(card);
  }
  async function loadProducts(){
    if(!productList) return;
    productList.innerHTML="";
    try {
      const snap = await db.collection("products").limit(200).get();
      if (snap.empty) {
        debug("⚠️ No products found. Showing placeholders.", false);
        for (let i=1;i<=12;i++) await addProductCard({id:"ph"+i,name:`Vape #${i}`,price:9.99,image:null});
        return;
      }
      for (const doc of snap.docs) {
        const d = doc.data() || {};
        await addProductCard({
          id: doc.id,
          name: d.name || d.title || "Unnamed",
          price: Number(d.price || d.cost || 0),
          image: d.image || d.img || d.imagePath || null
        });
      }
      debug(`✅ Loaded ${snap.size} products with images and prices.`, true);
    } catch (e) {
      console.error(e);
      debug("❌ Error loading products: " + (e.message || e), false);
    }
  }

  // ---------- Cart (buttons fixed) ----------
  let cart=[];
  const cartCount=$("#cart-count");
  const cartItems=$("#cart-items");
  const cartTotal=$("#cart-total");

  function saveCart(){ try{ localStorage.setItem("lb_cart", JSON.stringify(cart)); }catch{} }
  function loadCart(){ try{ cart = JSON.parse(localStorage.getItem("lb_cart")||"[]"); }catch{ cart=[]; } }

  function renderCart(){
    if(!cartItems) return;
    cartItems.innerHTML="";
    let total=0;
    cart.forEach((it,idx)=>{
      const lineTotal=(Number(it.price)||0)*it.qty; total+=lineTotal;
      const li=document.createElement("li");
      li.innerHTML=`
        <div>
          <div><b>${it.name}</b></div>
          <div style="color:#aaa;font-size:.9rem">$${(Number(it.price)||0).toFixed(2)} × ${it.qty}</div>
        </div>
        <div>
          <button class="btn" data-action="minus" data-index="${idx}">−</button>
          <button class="btn" data-action="plus"  data-index="${idx}">+</button>
          <button class="btn" data-action="remove" data-index="${idx}">Remove</button>
        </div>
      `;
      cartItems.appendChild(li);
    });
    if(cartCount) cartCount.textContent = cart.reduce((n,i)=>n+i.qty,0);
    if(cartTotal) cartTotal.textContent = total.toFixed(2);
    updateCheckoutLock();
  }

  on(cartItems,"click",(e)=>{
    const btn=e.target.closest("button"); if(!btn) return;
    const action=btn.getAttribute("data-action");
    const i=parseInt(btn.getAttribute("data-index"));
    if(Number.isNaN(i) || !cart[i]) return;
    if(action==="minus") cart[i].qty=Math.max(1, cart[i].qty-1);
    if(action==="plus")  cart[i].qty+=1;
    if(action==="remove") cart.splice(i,1);
    saveCart(); renderCart();
  });

  function addToCart(p){
    const i=cart.findIndex(x=>x.id===p.id);
    if(i>-1) cart[i].qty+=1;
    else cart.push({id:p.id,name:p.name,price:Number(p.price)||0,qty:1});
    saveCart(); renderCart();
  }

  on($("#clearCart"),"click",()=>{ cart=[]; saveCart(); renderCart(); });

  // ---------- Loyalty Stars ----------
  let starsCount = parseInt(localStorage.getItem("lb_stars")||"0");
  function renderStars(){
    const bar=$("#loyalty-stars"); if(!bar) return;
    const stars=$$(".star",bar);
    if(stars.length) stars.forEach((s,i)=>s.classList.toggle("active",i<starsCount));
  }
  async function addStarAndMaybeReward(){
    starsCount++; if(starsCount>6) starsCount=1;
    localStorage.setItem("lb_stars", String(starsCount)); renderStars();
    if(starsCount===6){
      try{
        await emailjs.send(KEYS.service, KEYS.template, {
          name: "Loyal Customer", phone: "N/A", address: "Reward",
          items: "🎁 FREE Vape Reward", total: "0.00"
        });
        debug("🎁 Free vape reward email sent!", true);
      }catch(e){ console.warn("Reward email error:", e); }
    }
  }

  // ---------- Scandit IDCapture (auto 21+), buttons fixed ----------
  let verified=false;
  let picker=null;
  let camActive=false;

  async function initScandit(){
    if(!window.ScanditSDK){ debug("Scandit SDK not loaded.", false); return false; }
    try{
      await ScanditSDK.configure(KEYS.scandit,{engineLocation:"https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/"});
      return true;
    }catch(e){ debug("Scandit init failed: "+(e.message||e), false); return false; }
  }

  function parseDOB(raw){
    // AAMVA PDF417: "DBB" + YYYYMMDD
    const m = raw.match(/DBB(\d{8})/);
    if(!m) return null;
    const y=m[1].slice(0,4), mo=m[1].slice(4,6), d=m[1].slice(6,8);
    return `${y}-${mo}-${d}`;
  }
  function calcAge(dobStr){
    const dob=new Date(dobStr);
    const now=new Date();
    let age=now.getFullYear()-dob.getFullYear();
    const m=now.getMonth()-dob.getMonth();
    if(m<0 || (m===0 && now.getDate()<dob.getDate())) age--;
    return age;
  }

  async function startCam(){
    if(camActive) return; // prevent double start
    const ok=await initScandit(); if(!ok){ alert("Scandit could not initialize."); return; }
    try{
      picker = await ScanditSDK.BarcodePicker.create($("#scanVideo"), {
        playSoundOnScan:true, vibrateOnScan:true
      });
      const settings = new ScanditSDK.ScanSettings({
        enabledSymbologies: ["pdf417"],
        codeDuplicateFilter: 1000
      });
      picker.applyScanSettings(settings);

      picker.onScan(res=>{
        const raw = res.barcodes[0]?.data || "";
        const dob = parseDOB(raw);
        if(dob){
          const age = calcAge(dob);
          if(age>=21){ verified=true; debug(`🎉 Verified — ${age} years old`, true); }
          else { verified=false; debug(`❌ Under 21 (${age})`, false); }
        } else {
          debug("Could not parse DOB from barcode.", false);
        }
        updateVerifyUI();
      });
      camActive=true;
      $("#startCamBtn").disabled=true;
      $("#stopCamBtn").disabled=false;
      debug("📸 Scandit camera active.", true);
    }catch(e){ alert("Camera error: "+(e.message||e)); }
  }

  function stopCam(){
    if(picker){ picker.destroy(); picker=null; }
    camActive=false;
    $("#startCamBtn").disabled=false;
    $("#stopCamBtn").disabled=true;
    debug("🔒 Camera stopped.", true);
  }

  function updateVerifyUI(){
    const out=$("#scanOut");
    if(out){
      out.textContent = verified ? "✅ Verified — Age 21+" : "❌ Not verified yet";
      out.style.color = verified ? "#9ef" : "#ff8c00";
    }
    // optional: hide glowing arrow when verified
    const arrow=$("#arrow"); if(arrow) arrow.style.display = verified ? "none" : "block";
    updateCheckoutLock();
  }

  function updateCheckoutLock(){
    const btn=$("#checkoutBtn"); if(!btn) return;
    const unlocked = verified && cart.length>0;
    btn.disabled = !unlocked;
    btn.textContent = unlocked ? "Proceed to Checkout ✅" : "Verify ID to Checkout 🔒";
  }

  on($("#startCamBtn"),"click",startCam);
  on($("#stopCamBtn"),"click",stopCam);

  // ---------- Checkout ----------
  on($("#checkoutBtn"),"click", async()=>{
    if(!verified){ alert("Please verify your ID (21+) first."); return; }
    if(cart.length===0){ alert("Your cart is empty."); return; }
    const name=$("#custName")?.value.trim()||"";
    const phone=$("#custPhone")?.value.trim()||"";
    const address=$("#custAddress")?.value.trim()||"";
    if(!name || !phone || !address){ alert("Please complete name, phone, and address."); return; }

    if(!(window.emailjs && KEYS.public && KEYS.service && KEYS.template)){
      alert("EmailJS is not configured. Tap the title to open Settings and paste your keys.");
      return;
    }

    const itemsText = cart.map(i=>`${i.name} × ${i.qty} ($${(i.price*i.qty).toFixed(2)})`).join("\n");
    const totalText = $("#cart-total")?.textContent || cart.reduce((s,i)=>s+(i.price*i.qty),0).toFixed(2);

    try{
      await emailjs.send(KEYS.service, KEYS.template, {
        name, phone, address, items: itemsText, total: totalText
      });
      debug("📨 Order email sent via EmailJS.", true);

      await addStarAndMaybeReward();

      if(KEYS.square){
        try{
          const u=new URL(KEYS.square);
          u.searchParams.set("name", name);
          u.searchParams.set("total", totalText);
          location.href = u.toString();
        }catch{ location.href = KEYS.square; }
      } else {
        alert("Order placed! (Add a Square link in Settings to accept payments.)");
      }

      cart=[]; saveCart(); renderCart(); updateCheckoutLock();
    }catch(e){
      console.error(e);
      alert("Could not send order: " + (e?.text || e?.message || e));
    }
  });

  // ---------- Boot ----------
  async function boot(){
    loadCart(); renderCart(); renderStars(); updateVerifyUI();
    await loadProducts();
    // camera buttons initial state
    if($("#startCamBtn")) $("#startCamBtn").disabled=false;
    if($("#stopCamBtn")) $("#stopCamBtn").disabled=true;
    debug("✅ LBizzo ready (Firebase, EmailJS, Scandit, Square, Loyalty).", true);
  }
  document.addEventListener("DOMContentLoaded", boot);
}
// ------------------ end ------------------
