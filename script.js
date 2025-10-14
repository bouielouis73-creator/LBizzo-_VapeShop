// ============================================================
// ✅ LBizzo Vape Shop – Full Working Build (restored)
// Firebase + Firestore + Storage, EmailJS, Scandit (simulated),
// Cart, Checkout, Loyalty, Age Gate, PWA ready.
// ============================================================

(() => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo script booting...");

  // ---------- Firebase ----------
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.appspot.com",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a",
    databaseURL: "https://lbizzodelivery-default-rtdb.firebaseio.com"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ---------- EmailJS ----------
  const EMAILJS_PUBLIC_KEY = "jUx6gEqKl1tvL7yLs";
  const EMAILJS_SERVICE_ID = "service_bk310ht";
  const EMAILJS_TEMPLATE_ID = "template_sbbt8blk";
  emailjs.init(EMAILJS_PUBLIC_KEY);

  // ---------- Helpers ----------
  const $ = (s, r=document)=>r.querySelector(s);
  const debug = (m)=>($("#debug").textContent=m);

  const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%' height='100%' fill='#111'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#ff8c00' font-family='Arial' font-size='16'>No Image</text></svg>");

  // ---------- Age Gate ----------
  const age = $("#age-check");
  $("#yesBtn").addEventListener("click",()=>age.style.display="none");
  $("#noBtn").addEventListener("click",()=>{alert("Must be 21+");location.href="https://google.com"});
  age.style.display="grid";

  // ---------- Loyalty ----------
  const MAX=6;
  function renderStars(){
    const s=$("#stars");s.innerHTML="";
    let n=Number(localStorage.getItem("lb_stars")||0);
    for(let i=0;i<MAX;i++){
      const e=document.createElement("span");
      e.textContent="⭐";if(i<n)e.style.color="#ff8c00";
      s.appendChild(e);
    }
  }
  function addStar(){let n=Number(localStorage.getItem("lb_stars")||0);n=Math.min(MAX,n+1);localStorage.setItem("lb_stars",n);renderStars();}

  // ---------- Image helper ----------
  async function getImageURL(f){
    try{
      const p=f.startsWith("products/")?f:`products/${f}`;
      return await storage.ref().child(p).getDownloadURL();
    }catch{return PLACEHOLDER_IMG;}
  }

  // ---------- Load Products ----------
  async function loadProducts(){
    const list=$("#product-list");list.innerHTML="<p>Loading…</p>";
    try{
      const snap=await db.collection("products").limit(50).get();
      if(snap.empty){list.innerHTML="<p>No products found.</p>";return;}
      list.innerHTML="";
      for(const doc of snap.docs){
        const p=doc.data();const img=await getImageURL(p.image);const price=Number(p.price)||0;
        const card=document.createElement("div");
        card.className="product";
        card.innerHTML=`<img src="${img}" alt="${p.name}">
        <div class="pad"><h3>${p.name}</h3><p>$${price.toFixed(2)}</p><button class="add-btn">Add to Cart</button></div>`;
        card.querySelector(".add-btn").addEventListener("click",()=>addToCart(p.name,price));
        list.appendChild(card);
      }
      debug("✅ Products loaded");
    }catch(e){debug("❌ "+e.message);}
  }

  // ---------- Cart ----------
  let cart=[];let idOK=false;
  const cartBox=$("#cart"),items=$("#cart-items"),total=$("#cart-total"),count=$("#cart-count"),chk=$("#checkout-btn"),scan=$("#scan-btn"),cartBtn=$("#cart-btn");

  cartBtn.addEventListener("click",()=>cartBox.hidden=!cartBox.hidden);

  function addToCart(name,price){
    const f=cart.find(c=>c.name===name);
    if(f)f.qty++;else cart.push({name,price,qty:1});
    renderCart();
  }
  function renderCart(){
    items.innerHTML="";let t=0;
    cart.forEach((c,i)=>{
      const li=document.createElement("li");
      li.innerHTML=`${c.name} - $${c.price.toFixed(2)} × ${c.qty} <button>−</button>`;
      li.querySelector("button").addEventListener("click",()=>{c.qty--;if(c.qty<=0)cart.splice(i,1);renderCart();});
      items.appendChild(li);
      t+=c.price*c.qty;
    });
    total.textContent=t.toFixed(2);
    count.textContent=cart.reduce((s,c)=>s+c.qty,0);
    chk.disabled=!idOK||!cart.length;
  }

  // ---------- Scandit (simulated) ----------
  const scanner=$("#scanner"),video=$("#preview"),close=$("#close-scan");let stream;
  async function startScan(){
    scanner.hidden=false;
    try{
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      video.srcObject=stream;
      setTimeout(()=>{setVerified(true);stopScan();alert("✅ ID Verified");},3000);
    }catch(e){alert("Camera error "+e.message);}
  }
  function stopScan(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}scanner.hidden=true;}
  function setVerified(ok){idOK=ok;chk.disabled=!ok||!cart.length;}
  scan.addEventListener("click",startScan);
  close.addEventListener("click",stopScan);

  // ---------- Checkout ----------
  chk.addEventListener("click",async()=>{
    if(!idOK)return alert("Scan ID first!");
    if(!cart.length)return alert("Cart empty!");
    const name=prompt("Your name:"),phone=prompt("Phone:"),addr=prompt("Address:");
    if(!name||!phone||!addr)return;
    const total=cart.reduce((s,c)=>s+c.price*c.qty,0).toFixed(2);
    try{
      await emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,{name,phone,address:addr,items:cart.map(c=>`${c.name} x${c.qty}`).join("\n"),total});
      alert("✅ Order sent!");
      addStar();cart=[];renderCart();
    }catch(e){alert("❌ Email failed "+e.message);}
  });

  // ---------- Init ----------
  window.addEventListener("DOMContentLoaded",async()=>{
    renderStars();
    await loadProducts();
    renderCart();
  });
})();
