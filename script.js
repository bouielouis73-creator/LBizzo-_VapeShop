// ------------------ LBizzo Vape Shop — script.js (with Scandit IDCapture) ------------------
if (window.__LBIZZO_BOOTED__) return;
window.__LBIZZO_BOOTED__ = true;

// ---------- helpers ----------
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const debug=(m,ok=false)=>{
  const b=$("#debug"); if(!b)return;
  b.textContent=m; b.style.display="block";
  b.style.background=ok?"#022":"#220";
  b.style.color=ok?"#9ef":"#f99";
};

// ---------- Firebase ----------
const firebaseConfig={
  apiKey:"AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain:"lbizzodelivery.firebaseapp.com",
  projectId:"lbizzodelivery",
  storageBucket:"lbizzodelivery.appspot.com",
  messagingSenderId:"614540837455",
  appId:"1:614540837455:web:42709d7b585bbdc2b8203a"
};
firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();
const storage=firebase.storage();

// ---------- Keys ----------
const KEYS={
  public:"jUx6gEqKI1tvL7yLs",
  service:"service_bk310ht",
  template:"template_sbbt8blk",
  square:"https://square.link/u/n0DB9QR7Q",
  scandit:"/* paste your Scandit license key here */"
};
try{emailjs.init(KEYS.public);}catch{}

// ---------- age check ----------
$("#yesBtn")?.addEventListener("click",()=>$("#age-check").style.display="none");
$("#noBtn")?.addEventListener("click",()=>{alert("Sorry, you must be 21+ to enter.");window.location.href="https://google.com";});

// ---------- load products ----------
async function getImageURL(p){
  if(!p)return null;
  if(p.startsWith("http"))return p;
  try{return await storage.ref("products/"+p).getDownloadURL();}
  catch{return null;}
}
async function addCard(p){
  const u=await getImageURL(p.image);
  const c=document.createElement("div");
  c.className="product";
  c.innerHTML=`<img src="${u||""}" alt="${p.name}">
    <h3>${p.name}</h3><p>$${(+p.price).toFixed(2)}</p>
    <button class="btn primary add">Add to Cart</button>`;
  c.querySelector(".add").onclick=()=>addToCart(p);
  $("#product-list").appendChild(c);
}
async function loadProducts(){
  const s=await db.collection("products").get();
  s.forEach(async d=>await addCard(d.data()));
}
loadProducts();

// ---------- cart ----------
let cart=[];
function renderCart(){
  const ul=$("#cart-items"); ul.innerHTML="";
  let t=0;
  cart.forEach((p,i)=>{
    t+=p.price*p.qty;
    const li=document.createElement("li");
    li.innerHTML=`${p.name} - $${p.price} × ${p.qty}
      <button class="btn" data-i="${i}">Remove</button>`;
    li.querySelector("button").onclick=()=>{cart.splice(i,1);renderCart();};
    ul.appendChild(li);
  });
  $("#cart-count").textContent=cart.length;
  $("#cart-total").textContent=t.toFixed(2);
  updateCheckoutLock();
}
function addToCart(p){
  const f=cart.find(x=>x.name===p.name);
  if(f)f.qty++;else cart.push({...p,qty:1});
  renderCart();
}
$("#clearCart").onclick=()=>{cart=[];renderCart();};

// ---------- loyalty stars ----------
let stars=parseInt(localStorage.getItem("stars")||"0");
function renderStars(){
  const s=$$("#loyalty-stars .star");
  s.forEach((x,i)=>x.classList.toggle("active",i<stars));
}
function addStar(){stars++;if(stars>6)stars=1;localStorage.setItem("stars",stars);renderStars();}
renderStars();

// ---------- Scandit IDCapture ----------
let verified=false;
let picker=null;

async function initScandit(){
  if(!window.ScanditSDK)return false;
  try{
    await ScanditSDK.configure(KEYS.scandit,{engineLocation:"https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/"});
    return true;
  }catch(e){debug("Scandit failed: "+e.message);return false;}
}

function parseDOB(raw){
  const m=raw.match(/DBB(\d{8})/);
  if(!m)return null;
  const y=m[1].slice(0,4),mo=m[1].slice(4,6),d=m[1].slice(6,8);
  return `${y}-${mo}-${d}`;
}
function calcAge(d){
  const dob=new Date(d);
  const diff=Date.now()-dob.getTime();
  return Math.abs(new Date(diff).getUTCFullYear()-1970);
}

async function startCam(){
  const ok=await initScandit(); if(!ok)return;
  try{
    picker=await ScanditSDK.BarcodePicker.create($("#scanVideo"),{playSoundOnScan:true,vibrateOnScan:true});
    const settings=new ScanditSDK.ScanSettings({enabledSymbologies:["pdf417"],codeDuplicateFilter:1000});
    picker.applyScanSettings(settings);
    picker.onScan(r=>{
      const raw=r.barcodes[0]?.data||"";
      const dob=parseDOB(raw);
      if(dob){
        const age=calcAge(dob);
        if(age>=21){verified=true;debug(`🎉 Verified age ${age}`,true);}
        else{verified=false;debug(`❌ Under 21 (${age})`,false);}
      }else{debug("No DOB found",false);}
      updateVerifyUI();
    });
    debug("📸 Scandit camera ready.",true);
  }catch(e){alert("Camera error: "+e.message);}
}
function stopCam(){if(picker){picker.destroy();picker=null;}debug("🔒 Camera stopped.",true);}

function updateVerifyUI(){
  const o=$("#scanOut");
  o.textContent=verified?"✅ Verified — 21+":"❌ Not verified yet";
  o.style.color=verified?"#9ef":"#ff8c00";
  updateCheckoutLock();
}
function updateCheckoutLock(){
  const b=$("#checkoutBtn");
  b.disabled=!(verified&&cart.length>0);
  b.textContent=b.disabled?"Verify ID to Checkout 🔒":"Proceed to Checkout ✅";
}
$("#startCamBtn").onclick=startCam;
$("#stopCamBtn").onclick=stopCam;

// ---------- checkout ----------
$("#checkoutBtn").onclick=async()=>{
  if(!verified)return alert("Verify ID first");
  const n=$("#custName").value,p=$("#custPhone").value,a=$("#custAddress").value;
  if(!(n&&p&&a))return alert("Fill all info");
  const items=cart.map(x=>`${x.name} × ${x.qty}`).join("\n");
  const total=$("#cart-total").textContent;
  await emailjs.send(KEYS.service,KEYS.template,{name:n,phone:p,address:a,items,total});
  addStar();
  window.location.href=KEYS.square;
  alert("Order sent!");
  cart=[];renderCart();
};
// ---------- end ----------
