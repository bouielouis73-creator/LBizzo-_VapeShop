// ------------------ LBizzo Vape Shop ------------------
if (window.__LBIZZO_BOOTED__) return;
window.__LBIZZO_BOOTED__ = true;

// ---------- Helpers ----------
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const debug=(m,ok=false)=>{
  const bar=$("#debug");
  if(!bar)return;
  bar.textContent=m;
  bar.style.display="block";
  bar.style.background=ok?"#022":"#220";
  bar.style.color=ok?"#7fffb3":"#ff6666";
};

// ---------- Firebase ----------
const firebaseConfig={
  apiKey:"AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain:"lbizzodelivery.firebaseapp.com",
  projectId:"lbizzodelivery",
  storageBucket:"lbizzodelivery.firebasestorage.app",
  messagingSenderId:"614540837455",
  appId:"1:614540837455:web:42709d7b585bbdc2b8203a"
};
firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();
const storage=firebase.storage();

// ---------- EmailJS ----------
const KEYS={
  public:localStorage.getItem("emailjs_public")||"",
  service:localStorage.getItem("emailjs_service")||"",
  template:localStorage.getItem("emailjs_template")||"",
  square:localStorage.getItem("square_base")||""
};
const applyKeys=()=>{
  $("#emailjsPublic").value=KEYS.public;
  $("#emailjsService").value=KEYS.service;
  $("#emailjsTemplate").value=KEYS.template;
  $("#squareBase").value=KEYS.square;
};
const saveKeys=()=>{
  KEYS.public=$("#emailjsPublic").value.trim();
  KEYS.service=$("#emailjsService").value.trim();
  KEYS.template=$("#emailjsTemplate").value.trim();
  KEYS.square=$("#squareBase").value.trim();
  Object.entries(KEYS).forEach(([k,v])=>localStorage.setItem("emailjs_"+k,v));
  if(window.emailjs&&KEYS.public) emailjs.init({publicKey:KEYS.public});
  debug("✅ Keys saved.",true);
};
$("#saveKeys")?.addEventListener("click",saveKeys);
$("#gear")?.addEventListener("click",()=>{
  const s=$("#settings");
  s.style.display=s.style.display==="block"?"none":"block";
});
window.addEventListener("load",()=>{
  applyKeys();
  if(window.emailjs&&KEYS.public) emailjs.init({publicKey:KEYS.public});
});

// ---------- Age Gate ----------
$("#yesBtn")?.addEventListener("click",()=>$("#age-check").style.display="none");
$("#noBtn")?.addEventListener("click",()=>{
  alert("Sorry, you must be 21+ to enter.");
  window.location.href="https://google.com";
});
window.addEventListener("load",()=>$("#age-check").style.display="flex");

// ---------- Scandit ID Verification ----------
const video=$("#vid");
let stream=null,frontData=null,backData=null,verified=false;
const SCANDIT_KEY="YOUR_SCANDIT_LICENSE_KEY"; // Replace with your Scandit key
let scanditLoaded=false;

async function initScandit(){
  if(scanditLoaded||!window.ScanditSDK) return;
  try{
    await ScanditSDK.configure(SCANDIT_KEY,{engineLocation:"https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/"});
    scanditLoaded=true;
    debug("Scandit SDK loaded",true);
  }catch(e){debug("Scandit load failed: "+e.message);}
}
const updateVerifyUI=()=>{
  const arrow=$(".arrow"),status=$("#verifyStatus");
  if(verified){
    status.innerHTML='Status: <b style="color:#7fffb3">Verified ✅</b>';
    arrow.classList.remove("glow");
  }else{
    status.innerHTML='Status: <b>Not verified</b>. Capture both sides.';
    arrow.classList.add("glow");
  }
  $("#checkoutBtn").disabled=!verified||cart.length===0;
};
async function startCam(){
  await initScandit();
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
    video.srcObject=stream;await video.play();
    debug("Camera started",true);
  }catch(e){alert("Camera error: "+e.message);}
}
function stopCam(){
  if(stream) stream.getTracks().forEach(t=>t.stop());
  video.srcObject=null;
}
function captureFrame(){
  if(!video.videoWidth)return null;
  const c=document.createElement("canvas");
  c.width=video.videoWidth;c.height=video.videoHeight;
  c.getContext("2d").drawImage(video,0,0);
  return c.toDataURL("image/jpeg",0.85);
}
async function verifyWithScandit(img){
  if(!scanditLoaded)return false;
  try{
    const image=await ScanditSDK.ImageSettings.createFromImage(img);
    // Actual verification placeholder — simulate success for demo
    return true;
  }catch{return false;}
}
$("#startCamBtn").addEventListener("click",startCam);
$("#stopCamBtn").addEventListener("click",stopCam);
$("#snapFront").addEventListener("click",async()=>{
  const d=captureFrame();if(!d)return;
  frontData=d;$("#frontImg").src=d;
  verified=!!(await verifyWithScandit(d))&&!!backData;
  updateVerifyUI();
});
$("#snapBack").addEventListener("click",async()=>{
  const d=captureFrame();if(!d)return;
  backData=d;$("#backImg").src=d;
  verified=!!(await verifyWithScandit(d))&&!!frontData;
  updateVerifyUI();
});
$("#clearFront").addEventListener("click",()=>{frontData=null;$("#frontImg").src="";verified=false;updateVerifyUI();});
$("#clearBack").addEventListener("click",()=>{backData=null;$("#backImg").src="";verified=false;updateVerifyUI();});

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
    <img src="${img||PLACEHOLDER_IMG}" alt="${p.name}" />
    <div class="p-in"><h3>${p.name}</h3><div class="price">$${price.toFixed(2)}</div>
    <button class="add-btn">Add to Cart</button></div>`;
  card.querySelector(".add-btn").addEventListener("click",()=>addToCart(p));
  productList.appendChild(card);
}
async function loadProducts(){
  productList.innerHTML="";
  try{
    const snap=await db.collection("products").limit(100).get();
    if(snap.empty){
      for(let i=1;i<=50;i++) await addCard({id:"ph"+i,name:"Product #"+i,price:9.99});
    }else{
      for(const d of snap.docs){
        const data=d.data();
        await addCard({id:d.id,name:data.name,price:data.price,image:data.image});
      }
    }
    debug("Products loaded",true);
  }catch(e){debug("Product load error: "+e.message);}
}

// ---------- Cart ----------
let cart=[];
function saveCart(){localStorage.setItem("lb_cart",JSON.stringify(cart));}
function loadCart(){cart=JSON.parse(localStorage.getItem("lb_cart")||"[]");}
function renderCart(){
  const list=$("#cart-items");list.innerHTML="";
  let total=0;
  cart.forEach((it,i)=>{
    total+=it.price*it.qty;
    const li=document.createElement("li");
    li.innerHTML=`<div><b>${it.name}</b><div class="small">$${it.price.toFixed(2)} × ${it.qty}</div></div>
    <div class="row"><button data-a="minus" class="ghost">−</button>
    <button data-a="plus">+</button><button data-a="del" class="danger">Remove</button></div>`;
    li.addEventListener("click",e=>{
      const a=e.target.dataset.a;if(!a)return;
      if(a==="minus")it.qty=Math.max(1,it.qty-1);
      if(a==="plus")it.qty+=1;
      if(a==="del")cart.splice(i,1);
      saveCart();renderCart();
    });
    list.appendChild(li);
  });
  $("#cart-count").textContent=cart.reduce((n,i)=>n+i.qty,0);
  $("#cart-total").textContent=total.toFixed(2);
  $("#checkoutBtn").disabled=!verified||cart.length===0;
}
function addToCart(p){
  const i=cart.findIndex(x=>x.id===p.id);
  if(i>-1)cart[i].qty+=1;else cart.push({id:p.id,name:p.name,price:Number(p.price)||0,qty:1});
  saveCart();renderCart();
}
$("#clearCart").addEventListener("click",()=>{cart=[];saveCart();renderCart();});

// ---------- Loyalty Stars ----------
let starsCount=parseInt(localStorage.getItem("lb_stars")||"0");
function renderStars(){
  const wrap=$("#stars"),bannerBox=$("#freeBanner");
  if(!wrap)return;
  wrap.innerHTML="";bannerBox.innerHTML="";
  for(let i=1;i<=6;i++){
    const s=document.createElement("span");
    s.textContent="★";
    s.className="star"+(i<=starsCount?" active":"");
    wrap.appendChild(s);
  }
  if(starsCount>=6){
    const b=document.createElement("div");
    b.className="free-banner";
    b.textContent="🎉 Congratulations! You earned a FREE vape!";
    bannerBox.appendChild(b);
  }
}
async function addStarAndMaybeReward(){
  starsCount++;
  if(starsCount>6)starsCount=1;
  localStorage.setItem("lb_stars",starsCount);
  renderStars();
  if(starsCount===6){
    try{
      if(window.emailjs&&KEYS.service&&KEYS.template){
        await emailjs.send(KEYS.service,KEYS.template,{
          name:"Loyal Customer",
          phone:"N/A",
          address:"Reward",
          items:"🎁 FREE Vape Reward",
          total:"0.00"
        });
        debug("🎁 Free vape reward email sent!",true);
      }
    }catch(e){console.error("Reward email error:",e);}
  }
}

// ---------- Checkout ----------
$("#checkoutBtn").addEventListener("click",async()=>{
  if(!verified){alert("ID not verified yet.");return;}
  if(cart.length===0){alert("Cart empty.");return;}
  const name=$("#custName").value.trim(),phone=$("#custPhone").value.trim(),addr=$("#custAddress").value.trim();
  if(!name||!phone||!addr){alert("Fill all fields.");return;}
  if(!(window.emailjs&&KEYS.public&&KEYS.service&&KEYS.template)){
    alert("EmailJS not configured (⚙️ Settings).");return;
  }
  const items=cart.map(i=>`${i.name} × ${i.qty} ($${(i.price*i.qty).toFixed(2)})`).join("\n");
  const total
