// ---------------- LBizzo Vape Shop - Full App ----------------
if (window.__LBIZZO_BOOTED__) { console.warn("LBizzo already loaded."); }
else {
  window.__LBIZZO_BOOTED__ = true;

  // ---------- Helpers ----------
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const debug = (msg, ok=false) => {
    const bar = $("#debug");
    if (!bar) return;
    bar.textContent = msg;
    bar.hidden = false;
    bar.style.background = ok ? "#0c1a0c" : "#1a0c0c";
    bar.style.color = ok ? "#9ef1b0" : "#f19999";
  };

  // ---------- Firebase ----------
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.appspot.com",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
  };
  try { firebase.initializeApp(firebaseConfig); } catch {}
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ---------- Keys ----------
  const KEYS = {
    public:  localStorage.getItem("emailjs_public")  || "jUx6gEqKI1tvL7yLs",
    service: localStorage.getItem("emailjs_service") || "service_bk310ht",
    template:localStorage.getItem("emailjs_template")|| "template_sbbt8blk",
    square:  localStorage.getItem("square_base")     || "https://square.link/u/n0DB9QR7Q",
    scandit: localStorage.getItem("scandit_key")     || "AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRdDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDRq/3pbdNQ2wHBxXMlLL1ubSkte/FG9MLxf7J9KQC5/jlqBwhtXC8O8amwpv0g1/Txo/v8tVBMqkxkYTEZ7AeUvXC9mb0GYDlt+RdXhQedpeU+YQxcj1zzQa+pYTlx1d5laJHh3WMjL1nKzEUZlZXZpUZbxASRzM48blxXef8EtyyVCnS5X2WyBWRUGEGVfjUIiawJRFrxu31ll5ghjcpeWHsJTdTrYUGgegsdXcz6jeB0jcg6cISpkQ+vfVYZ1Cz33hCdJIpjP6YdV1txoUHPQf/9KJkImFT6XFWj6khyUHtnZjDZyyApE4bWHuMZtDzghqN30nYaX47bZQbrSELMCguYjhVRrUaA4M1IBTHMjtwTlFNFSTups1/pUFPI4mNV8ZuKuRwANY9MO4STHjdCfX6CA/xjsbBbBc+b5N1N8E70TNlAUsov2sgisR7ICqNFXG+H93QFuKd3F6nVvY8DiYOZ+7HvY5KVBkIY2Fys70JRdPyRQeCpRdEmwzReb//77uF344Wt0UZmFXSNBAOEPJdDjRvAllzC7ZRtiGYiSbGlV9yDs6Ly6XF0miq2G3pZtiTCQqdYT2/R7M0ENi4qLYDnLbfFAiux3PI/AmUsOfbWRxnKARt2pWn0vFHIdgeswEMITqF2etKjPbjzy5LDs+YxXfF+D4h//svwIUeMuOAjunsNRs2ZUpzdMGAXzUTF/YEE/upE1tRmFrDAWDKzYpb9ouoKNNPDR9SgrwhcCKk+nXbpOhiWlkZjVmBr0edch/b/2ywfMtImPqq/CWix1RSlYHse85OSKKiXaGRp6FqhBccGh7h2FVOWvgVC75c7vJ+sOvksOxhLI8IR46aAnNDHatQwBjrHeIBBbNBNUKj2u34KXvvSvC6qM7FVWKUt1b5zu2rGc4NI="
  };

  // ---------- EmailJS ----------
  try { emailjs.init({ publicKey: KEYS.public }); } catch {}

  // ---------- Age Verification (fixed) ----------
  document.addEventListener("DOMContentLoaded", () => {
    const ageOverlay = document.getElementById("age-check");
    const yesBtn = document.getElementById("yesBtn");
    const noBtn = document.getElementById("noBtn");

    if (ageOverlay) ageOverlay.style.display = "grid";

    if (yesBtn) yesBtn.addEventListener("click", () => {
      ageOverlay.style.display = "none";
      debug("✅ Age verified overlay hidden", true);
    });

    if (noBtn) noBtn.addEventListener("click", () => {
      alert("Sorry, you must be 21+ to enter.");
      window.location.href = "https://google.com";
    });
  });

  // ---------- Load Products ----------
  const productList = $("#product-list");
  async function getImageURL(path){
    if(!path) return null;
    if(path.startsWith("http")) return path;
    try { return await storage.ref(`products/${path}`).getDownloadURL(); }
    catch { console.warn("Missing image:", path); return null; }
  }

  async function loadProducts(){
    productList.innerHTML="";
    try {
      const snap = await db.collection("products").limit(50).get();
      if (snap.empty) { debug("⚠️ No products found.", false); return; }
      for (const doc of snap.docs){
        const d = doc.data();
        const url = await getImageURL(d.image);
        const div = document.createElement("div");
        div.className="product";
        div.innerHTML = `
          <img src="${url||''}" alt="${d.name}">
          <h3>${d.name}</h3>
          <p>$${(d.price||0).toFixed(2)}</p>
          <button class="btn primary add">Add to Cart</button>`;
        on(div.querySelector(".add"),"click",()=>addToCart({id:doc.id,name:d.name,price:d.price}));
        productList.appendChild(div);
      }
      debug("✅ Products loaded from Firebase.", true);
    }catch(e){ debug("Error loading products: "+e, false); }
  }

  // ---------- Cart ----------
  let cart=[]; const cartItems=$("#cart-items"), cartTotal=$("#cart-total"), cartCount=$("#cart-count");
  function saveCart(){ localStorage.setItem("lb_cart",JSON.stringify(cart)); }
  function renderCart(){
    cartItems.innerHTML=""; let total=0;
    cart.forEach((i,idx)=>{
      const line=i.price*i.qty; total+=line;
      const li=document.createElement("li");
      li.innerHTML=`<div><b>${i.name}</b> $${i.price} × ${i.qty}</div>
      <div><button class='btn' data-a='minus' data-i='${idx}'>−</button>
      <button class='btn' data-a='plus' data-i='${idx}'>+</button>
      <button class='btn' data-a='remove' data-i='${idx}'>Remove</button></div>`;
      cartItems.appendChild(li);
    });
    cartTotal.textContent=total.toFixed(2);
    cartCount.textContent=cart.reduce((n,i)=>n+i.qty,0);
    updateCheckoutLock();
  }
  on(cartItems,"click",e=>{
    const b=e.target.closest("button"); if(!b) return;
    const i=parseInt(b.dataset.i); const a=b.dataset.a;
    if(a==="plus") cart[i].qty++;
    if(a==="minus") cart[i].qty=Math.max(1,cart[i].qty-1);
    if(a==="remove") cart.splice(i,1);
    saveCart(); renderCart();
  });
  function addToCart(p){ const i=cart.findIndex(x=>x.id===p.id);
    if(i>-1) cart[i].qty++; else cart.push({...p,qty:1});
    saveCart(); renderCart(); }

  // ---------- Scandit ----------
  let picker=null, camActive=false, verified=false;
  async function initScandit(){
    try{
      await ScanditSDK.configure(KEYS.scandit,{engineLocation:"https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/"});
      return true;
    }catch(e){
      window.__lastScanditError=e.message;
      debug("Scandit init failed: "+e.message,false);
      return false;
    }
  }
  function parseDOB(raw){ const m=raw.match(/DBB(\d{8})/); if(!m) return null;
    const y=m[1].slice(0,4), mo=m[1].slice(4,6), d=m[1].slice(6,8);
    return `${y}-${mo}-${d}`;}
  function calcAge(d){const dob=new Date(d),now=new Date();
    let age=now.getFullYear()-dob.getFullYear();
    const m=now.getMonth()-dob.getMonth();
    if(m<0||(m===0&&now.getDate()<dob.getDate())) age--;return age;}
  async function startCam(){
    if(camActive) return;
    const ok=await initScandit();
    if(!ok){ alert("Scandit could not initialize: "+(window.__lastScanditError||"unknown")); return; }
    try{
      picker=await ScanditSDK.BarcodePicker.create($("#scanVideo"),{playSoundOnScan:true,vibrateOnScan:true});
      const s=new ScanditSDK.ScanSettings({enabledSymbologies:["pdf417"]});
      picker.applyScanSettings(s);
      picker.onScan(res=>{
        const raw=res.barcodes[0]?.data||""; const dob=parseDOB(raw);
        if(dob){ const age=calcAge(dob);
          if(age>=21){ verified=true; debug(`✅ Verified ${age}`,true);}
          else{ verified=false; debug(`❌ Under 21 (${age})`,false);}
        } else debug("Could not read DOB",false);
        updateVerifyUI();
      });
      camActive=true; $("#startCamBtn").disabled=true; $("#stopCamBtn").disabled=false;
    }catch(e){ alert("Camera error: "+e.message); }
  }
  function stopCam(){ if(picker){ picker.destroy(); picker=null; } camActive=false;
    $("#startCamBtn").disabled=false; $("#stopCamBtn").disabled=true;
    debug("🔒 Camera stopped.",true); }
  function updateVerifyUI(){
    const o=$("#scanOut"); o.textContent=verified?"✅ Verified — 21+":"❌ Not verified yet";
    o.style.color=verified?"#9ef":"#ff8c00"; updateCheckoutLock(); }

  on($("#startCamBtn"),"click",startCam);
  on($("#stopCamBtn"),"click",stopCam);

  // ---------- Checkout ----------
  function updateCheckoutLock(){
    const btn=$("#checkoutBtn");
    const unlocked=verified && cart.length>0;
    btn.disabled=!unlocked;
    btn.textContent=unlocked?"Proceed to Checkout ✅":"Verify ID to Checkout 🔒";
  }

  on($("#checkoutBtn"),"click",async()=>{
    if(!verified) return alert("Please verify ID first.");
    const name=$("#custName").value.trim(), phone=$("#custPhone").value.trim(), addr=$("#custAddress").value.trim();
    if(!name||!phone||!addr) return alert("Fill all details.");
    const items=cart.map(i=>`${i.name} × ${i.qty} = $${(i.price*i.qty).toFixed(2)}`).join("\n");
    const total=$("#cart-total").textContent;

    try{
      await emailjs.send(KEYS.service,KEYS.template,{name,phone,address:addr,items,total});
      debug("📨 Order email sent!",true);
      if(KEYS.square){ window.location.href=KEYS.square; }
      cart=[]; saveCart(); renderCart(); updateCheckoutLock();
    }catch(e){ alert("EmailJS error: "+(e.message||e)); }
  });

  // ---------- Loyalty Stars ----------
  let starsCount=parseInt(localStorage.getItem("lb_stars")||"0");
  function renderStars(){
    const bar=$("#loyalty-stars");
    const stars=$$(".star",bar);
    stars.forEach((s,i)=>s.classList.toggle("active",i<starsCount));
  }

  async function addStarAndMaybeReward(){
    starsCount++; if(starsCount>6) starsCount=1;
    localStorage.setItem("lb_stars",starsCount);
    renderStars();
    if(starsCount===6){
      await emailjs.send(KEYS.service,KEYS.template,{name:"Loyal Customer",items:"🎁 Free Vape Reward",total:"0.00"});
      debug("🎁 Free vape reward sent!",true);
    }
  }

  // ---------- Boot ----------
  async function boot(){
    renderCart();
    await loadProducts();
    renderStars();
    updateVerifyUI();
    debug("✅ LBizzo Ready", true);
  }
  document.addEventListener("DOMContentLoaded", boot);
}
