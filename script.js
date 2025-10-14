// ---------- AGE VERIFICATION ----------
window.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("age-check");
  const yes = document.getElementById("yesBtn");
  const no  = document.getElementById("noBtn");

  if (!overlay || !yes || !no) return;

  overlay.style.display = "grid";
  const allow = (e) => {
    e.preventDefault();
    overlay.style.display = "none";
    console.log("✅ Age verified overlay hidden");
  };
  const deny = (e) => {
    e.preventDefault();
    alert("Sorry, you must be 21+ to enter.");
    window.location.href = "https://google.com";
  };
  ["click", "touchstart"].forEach(evt => {
    yes.addEventListener(evt, allow, { passive: false });
    no.addEventListener(evt, deny, { passive: false });
  });
});

// ---------- HELPERS ----------
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const debug = (msg, ok=false) => {
  const bar = $("#debug");
  if (!bar) return;
  bar.textContent = msg;
  bar.style.display = "block";
  bar.style.background = ok ? "#022" : "#200";
  bar.style.color = ok ? "#0f0" : "#f66";
};

// ---------- FIREBASE ----------
const firebaseConfig = {
  apiKey: "AIzaSyAMSTyqnUMfyaNMEusapADjoCqSYfjZCs",
  authDomain: "lbizzodelivery.firebaseapp.com",
  projectId: "lbizzodelivery",
  storageBucket: "lbizzodelivery.appspot.com",
  messagingSenderId: "614540837455",
  appId: "1:614540837455:web:42709d7b585bbdc2b8203a"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// ---------- EMAILJS ----------
emailjs.init("jUx6gEqKI1tvL7yLs");

// ---------- GLOBALS ----------
let cart = [];
let verified = false;
let picker = null;

// ---------- IMAGE LOADER ----------
async function getImageURL(path){
  if (!path) return null;
  try {
    const ref = path.startsWith("products/") ? storage.ref(path) : storage.ref("products/" + path);
    return await ref.getDownloadURL();
  } catch {
    return "data:image/svg+xml;utf8," + encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
        <rect width='100%' height='100%' fill='#0b0b0b'/>
        <rect x='16' y='16' width='368' height='268' rx='16' fill='#141414' stroke='#ff8c00' stroke-width='4'/>
        <text x='50%' y='55%' text-anchor='middle' font-size='28' fill='#ff8c00' font-family='Arial Black, Arial'>LBizzo</text>
      </svg>
    `);
  }
}

// ---------- PRODUCTS ----------
async function addProductCard(p){
  const list = $("#product-list");
  const img = await getImageURL(p.image);
  const card = document.createElement("div");
  card.className = "product";
  card.innerHTML = `
    <img src="${img}" alt="${p.name}" />
    <h3>${p.name}</h3>
    <p>$${(p.price||0).toFixed(2)}</p>
    <button class="btn primary add">Add to Cart</button>`;
  card.querySelector(".add").onclick = () => addToCart(p);
  list.appendChild(card);
}

async function loadProducts(){
  const list = $("#product-list");
  list.innerHTML = "";
  try {
    const snap = await db.collection("products").get();
    if (snap.empty) {
      debug("⚠️ No products found in Firestore.", false);
      return;
    }
    for (const doc of snap.docs) {
      const d = doc.data();
      await addProductCard({
        name: d.name || "Unnamed Product",
        price: Number(d.price) || 0,
        image: d.image || null
      });
    }
    debug(`✅ Loaded ${snap.size} products from Firebase.`, true);
  } catch (e) {
    console.error(e);
    debug("❌ Error loading products: " + e.message, false);
  }
}

// ---------- CART ----------
function renderCart(){
  const list = $("#cart-items");
  list.innerHTML = "";
  let total = 0;
  cart.forEach((item,i)=>{
    const li = document.createElement("li");
    total += item.price * item.qty;
    li.innerHTML = `
      <div><b>${item.name}</b> $${item.price} × ${item.qty}</div>
      <div>
        <button data-i="${i}" data-a="minus">−</button>
        <button data-i="${i}" data-a="plus">+</button>
        <button data-i="${i}" data-a="remove">Remove</button>
      </div>`;
    list.appendChild(li);
  });
  $("#cart-total").textContent = total.toFixed(2);
  $("#cart-count").textContent = cart.reduce((n,i)=>n+i.qty,0);
}
$("#cart-items").onclick = e=>{
  const b=e.target.closest("button"); if(!b)return;
  const i=b.dataset.i, a=b.dataset.a;
  if(a==="plus") cart[i].qty++;
  if(a==="minus") cart[i].qty=Math.max(1,cart[i].qty-1);
  if(a==="remove") cart.splice(i,1);
  renderCart();
};
$("#clearCart").onclick=()=>{cart=[];renderCart();};
function addToCart(p){
  const i=cart.findIndex(x=>x.name===p.name);
  if(i>-1) cart[i].qty++;
  else cart.push({...p,qty:1});
  renderCart();
}

// ---------- LOYALTY ----------
let starsCount = parseInt(localStorage.getItem("lb_stars")||"0");
function renderStars(){
  const stars=$$("#loyalty-stars .star");
  stars.forEach((s,i)=>s.classList.toggle("active",i<starsCount));
}
function addStar(){
  starsCount++;
  if(starsCount>=6){starsCount=0;alert("🎁 Free vape reward!");}
  localStorage.setItem("lb_stars",starsCount);
  renderStars();
}

// ---------- SCANDIT ----------
async function startCam(){
  try{
    await ScanditSDK.configure(
      "AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRdDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDRq/3pbdNQ2wHBxXMlLL1ubSkte/FG9MLxf7J9KQC5/jlqBwhtXC8O8amwpv0g1/Txo/v8tVBMqkxkYTEZ7AeUvXC9mb0GYDlt+RdXhQedpeU+YQxcj1zzQa+pYTlx1d5laJHh3WMjL1nKzEUZlZXZpUZbxASRzM48blxXef8EtyyVCnS5X2WyBWRUGEGVfjUIiawJRFrxu31ll5ghjcpeWHsJTdTrYUGgegsdXcz6jeB0jcg6cISpkQ+vfVYZ1Cz33hCdJIpjP6YdV1txoUHPQf/9KJkImFT6XFWj6khyUHtnZjDZyyApE4bWHuMZtDzghqN30nYaX47bZQbrSELMCguYjhVRrUaA4M1IBTHMjtwTlFNFSTups1/pUFPI4mNV8ZuKuRwANY9MO4STHjdCfX6CA/xjsbBbBc+b5N1N8E70TNlAUsov2sgisR7ICqNFXG+H93QFuKd3F6nVvY8DiYOZ+7HvY5KVBkIY2Fys70JRdPyRQeCpRdEmwzReb//77uF344Wt0UZmFXSNBAOEPJdDjRvAllzC7ZRtiGYiSbGlV9yDs6Ly6XF0miq2G3pZtiTCQqdYT2/R7M0ENi4qLYDnLbfFAiux3PI/AmUsOfbWRxnKARt2pWn0vFHIdgeswEMITqF2etKjPbjzy5LDs+YxXfF+D4h//svwIUeMuOAjunsNRs2ZUpzdMGAXzUTF/YEE/upE1tRmFrDAWDKzYpb9ouoKNNPDR9SgrwhcCKk+nXbpOhiWlkZjVmBr0edch/b/2ywfMtImPqq/CWix1RSlYHse85OSKKiXaGRp6FqhBccGh7h2FVOWvgVC75c7vJ+sOvksOxhLI8IR46aAnNDHatQwBjrHeIBBbNBNUKj2u34KXvvSvC6qM7FVWKUt1b5zu2rGc4NI=",
      {engineLocation:"https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/"}
    );
    picker = await ScanditSDK.BarcodePicker.create($("#scanVideo"));
    const settings = new ScanditSDK.ScanSettings({enabledSymbologies:["pdf417"]});
    picker.applyScanSettings(settings);
    picker.onScan(res=>{
      const data=res.barcodes[0]?.data||"";
      if(data.includes("DBB")){
        const dob=data.match(/DBB(\d{8})/)[1];
        const year=parseInt(dob.slice(0,4));
        const age=new Date().getFullYear()-year;
        if(age>=21){verified=true;debug("✅ ID Verified 21+",true);}
        else{verified=false;debug("❌ Under 21",false);}
      }
    });
  }catch(e){alert("Scandit error: "+e.message);}
}
$("#startCamBtn").onclick=startCam;
$("#stopCamBtn").onclick=()=>{if(picker){picker.destroy();picker=null;}};

// ---------- CHECKOUT ----------
$("#checkoutBtn").onclick=async()=>{
  if(!verified){alert("Please verify your ID first.");return;}
  if(cart.length===0){alert("Your cart is empty.");return;}
  const name=$("#custName").value.trim();
  const phone=$("#custPhone").value.trim();
  const address=$("#custAddress").value.trim();
  const items=cart.map(i=>`${i.name} x${i.qty}`).join(", ");
  const total=$("#cart-total").textContent;

  try{
    await emailjs.send("service_bk310ht","template_sbbt8blk",
      {name,phone,address,items,total});
    debug("📨 Order sent via EmailJS",true);
    window.location.href="https://square.link/u/n0DB9QR7Q";
  }catch(e){alert("Email error: "+e.message);}
};

// ---------- BOOT ----------
window.addEventListener("load",()=>{
  renderStars();
  loadProducts();
  renderCart();
});
