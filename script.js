// ---------- LBizzo Vape Shop - script.js (Full & Working) ----------

// ✅ Prevent double load
if (window.__LBIZZO_BOOTED__) {
  console.warn("LBizzo already initialized — skipping duplicate load.");
} else {
  window.__LBIZZO_BOOTED__ = true;

  // ---------- Helpers ----------
  const $ = (sel, root=document)=>root.querySelector(sel);
  const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));
  const debugBar = $("#debug");
  const debug = (msg, ok=false)=>{
    if(!debugBar) return;
    debugBar.textContent = msg;
    debugBar.style.display = "block";
    debugBar.style.background = ok ? "#022" : "#220";
    debugBar.style.color = ok ? "#7fffb3" : "#ff6666";
  };

  // ---------- Firebase ----------
  const firebaseConfig = {
    apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
    authDomain: "lbizzodelivery.firebaseapp.com",
    projectId: "lbizzodelivery",
    storageBucket: "lbizzodelivery.firebasestorage.app",
    messagingSenderId: "614540837455",
    appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
  };
  try { firebase.initializeApp(firebaseConfig); } catch(_) {}
  const db = firebase.firestore();
  const storage = firebase.storage();

  // ---------- EmailJS ----------
  const KEYS = {
    public: localStorage.getItem("emailjs_public") || "",
    service: localStorage.getItem("emailjs_service") || "",
    template: localStorage.getItem("emailjs_template") || "",
    square: localStorage.getItem("square_base") || ""
  };
  const applyKeys = ()=>{
    $("#emailjsPublic").value = KEYS.public;
    $("#emailjsService").value = KEYS.service;
    $("#emailjsTemplate").value = KEYS.template;
    $("#squareBase").value = KEYS.square;
  };
  const saveKeys = ()=>{
    KEYS.public = $("#emailjsPublic").value.trim();
    KEYS.service = $("#emailjsService").value.trim();
    KEYS.template = $("#emailjsTemplate").value.trim();
    KEYS.square = $("#squareBase").value.trim();
    Object.entries(KEYS).forEach(([k,v])=>localStorage.setItem("emailjs_"+k,v));
    if(window.emailjs && KEYS.public) emailjs.init({publicKey:KEYS.public});
    debug("✅ Keys saved locally", true);
  };
  $("#saveKeys")?.addEventListener("click", saveKeys);
  $("#gear")?.addEventListener("click", ()=>{
    const s=$("#settings"); s.style.display = s.style.display==="block"?"none":"block";
  });
  window.addEventListener("load", ()=>{
    applyKeys();
    if(window.emailjs && KEYS.public) emailjs.init({publicKey:KEYS.public});
  });

  // ---------- Age Check ----------
  const ageCheck=$("#age-check"), yesBtn=$("#yesBtn"), noBtn=$("#noBtn");
  if(yesBtn) yesBtn.addEventListener("click", ()=>{
    if(ageCheck) ageCheck.style.display="none";
    document.body.style.overflow="auto";
  });
  if(noBtn) noBtn.addEventListener("click", ()=>{
    alert("Sorry, you must be 21+ to enter LBizzo Vape Shop.");
    window.location.href="https://www.google.com";
  });
  window.addEventListener("load", ()=>{ if(ageCheck) ageCheck.style.display="flex"; });

  // ---------- ID Camera ----------
  const video=$("#vid");
  let stream=null, frontData=null, backData=null;
  const updateVerifyUI=()=>{
    const ok=!!frontData && !!backData;
    $("#verifyStatus").innerHTML = ok
      ? 'Status: <b style="color:#7fffb3">Verified</b>. You can checkout.'
      : 'Status: <b>Not verified</b>. Capture both sides to continue.';
    $("#checkoutBtn").disabled = !ok || cart.length===0;
    $(".arrow").classList.toggle("glow", !ok);
  };
  const startCam=async()=>{
    try{
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      video.srcObject=stream; await video.play(); debug("Camera started", true);
    }catch(e){alert("Camera error: "+e.message);}
  };
  const stopCam=()=>{if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;} video.srcObject=null;};
  $("#startCamBtn")?.addEventListener("click",startCam);
  $("#stopCamBtn")?.addEventListener("click",stopCam);
  const capture=()=>{
    if(!video.videoWidth){alert("Camera not ready");return null;}
    const c=document.createElement("canvas");c.width=video.videoWidth;c.height=video.videoHeight;
    const ctx=c.getContext("2d");ctx.drawImage(video,0,0);return c.toDataURL("image/jpeg",0.85);
  };
  $("#snapFront")?.addEventListener("click",()=>{const d=capture();if(!d)return;frontData=d;$("#frontImg").src=d;updateVerifyUI();});
  $("#snapBack")?.addEventListener("click",()=>{const d=capture();if(!d)return;backData=d;$("#backImg").src=d;updateVerifyUI();});
  $("#clearFront")?.addEventListener("click",()=>{frontData=null;$("#frontImg").src="";updateVerifyUI();});
  $("#clearBack")?.addEventListener("click",()=>{backData=null;$("#backImg").src="";updateVerifyUI();});

  // ---------- Products ----------
  const productList=$("#product-list");
  const PLACEHOLDER_IMG="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'><rect width='100%' height='100%' fill='#000'/><rect x='32' y='32' width='448' height='448' rx='40' fill='#111' stroke='#ff8c00' stroke-width='8'/><text x='50%' y='54%' font-family='Arial Black,Arial' font-size='60' text-anchor='middle' fill='#ff8c00'>LBizzo</text></svg>");
  async function getImageURL(p){try{if(!p)return null;return await storage.ref(p).getDownloadURL();}catch{return null;}}
  async function addCard(p){
    const price=Number(p.price)||0;
    const img=await getImageURL(p.image);
    const card=document.createElement("div");
    card.className="product";
    card.innerHTML=`
      <img src="${img||PLACEHOLDER_IMG}" alt="${p.name}" onerror="this.src='${PLACEHOLDER_IMG}'"/>
      <div class="p-in"><h3>${p.name}</h3><div class="price">$${price.toFixed(2)}</div>
      <button class="add-btn">Add to Cart</button></div>`;
    card.querySelector(".add-btn").addEventListener("click",()=>addToCart(p));
    productList.appendChild(card);
  }
  async function loadProducts(){
    productList.innerHTML="";
    try{
      const snap=await db.collection("products").limit(200).get();
      if(snap.empty){
        const ph=Array.from({length:50}).map((_,i)=>({id:"ph"+i,name:`Product #${i+1}`,price:9.99}));
        for(const p of ph) await addCard(p);
        debug("No products found - showing placeholders",true);
      }else{
        for(const doc of snap.docs){
          const d=doc.data();await addCard({id:doc.id,name:d.name,price:d.price,image:d.image});
        }
        debug("Products loaded",true);
      }
    }catch(e){debug("Error loading products: "+e.message);}
  }

  // ---------- Cart ----------
  let cart=[];
  const cartCount=$("#cart-count"),cartItems=$("#cart-items"),cartTotal=$("#cart-total");
  function saveCart(){localStorage.setItem("lb_cart",JSON.stringify(cart));}
  function loadCart(){cart=JSON.parse(localStorage.getItem("lb_cart")||"[]");}
  function renderCart(){
    cartItems.innerHTML="";let total=0;
    cart.forEach((it,i)=>{
      total+=it.price*it.qty;
      const li=document.createElement("li");
      li.innerHTML=`<div><b>${it.name}</b><div class="small">$${it.price.toFixed(2)} × ${it.qty}</div></div>
      <div class="row"><button data-a="minus" class="ghost">−</button><button data-a="plus">+</button><button data-a="del" class="danger">Remove</button></div>`;
      li.addEventListener("click",e=>{
        const a=e.target.getAttribute("data-a");if(!a)return;
        if(a==="minus")it.qty=Math.max(1,it.qty-1);
        if(a==="plus")it.qty+=1;
        if(a==="del")cart.splice(i,1);
        saveCart();renderCart();
      });
      cartItems.appendChild(li);
    });
    cartCount.textContent=cart.reduce((n,i)=>n+i.qty,0);
    cartTotal.textContent=total.toFixed(2);
    $("#checkoutBtn").disabled=!(frontData&&backData)||cart.length===0;
  }
  function addToCart(p){
    const i=cart.findIndex(x=>x.id===p.id);
    if(i>-1)cart[i].qty+=1;else cart.push({id:p.id,name:p.name,price:Number(p.price)||0,qty:1});
    saveCart();renderCart();
  }
  $("#clearCart").addEventListener("click",()=>{cart=[];saveCart();renderCart();});

  // ---------- Checkout ----------
  $("#checkoutBtn").addEventListener("click",async()=>{
    if(!(frontData&&backData)){alert("Capture both sides of your ID first.");return;}
    if(cart.length===0){alert("Cart empty.");return;}
    const name=$("#custName").value.trim(),phone=$("#custPhone").value.trim(),addr=$("#custAddress").value.trim();
    if(!name||!phone||!addr){alert("Fill out name, phone & address.");return;}
    if(!(window.emailjs&&KEYS.public&&KEYS.service&&KEYS.template)){
      alert("EmailJS not configured. Tap ⚙️ to set keys.");return;
    }
    const items=cart.map(i=>`${i.name} × ${i.qty} ($${(i.price*i.qty).toFixed(2)})`).join("\n");
    const total=cartTotal.textContent;
    try{
      await emailjs.send(KEYS.service,KEYS.template,{name,phone,address:addr,items,total,id_front:frontData,id_back:backData});
      debug("Order sent",true);
      if(KEYS.square){const u=new URL(KEYS.square);u.searchParams.set("name",name);u.searchParams.set("total",total);window.location.href=u.toString();}
      else alert("Order placed! Email sent.");
      cart=[];saveCart();renderCart();
    }catch(e){alert("Email error: "+e.message);}
  });

  // ---------- Boot ----------
  async function boot(){loadCart();renderCart();updateVerifyUI();await loadProducts();debug("✅ App ready",true);}
  document.addEventListener("DOMContentLoaded",boot);
}
