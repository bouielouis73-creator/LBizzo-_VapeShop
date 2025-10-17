document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO__) return;
  window.__LBIZZO__ = true;

  const EMAILJS_PUBLIC_KEY = "jUx6gEqKI1tvL7yLs";
  const EMAILJS_SERVICE_ID = "service_7o2u4kq";
  const EMAILJS_TEMPLATE_ID = "template_6jlkofi";
  const SCANDIT_LICENSE_KEY = "AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRdDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDR";

  const $ = s => document.querySelector(s);
  const debug = m => { const d=$("#debug"); if(d){d.hidden=false;d.textContent=m;} };
  const fmt = n => `$${(Number(n)||0).toFixed(2)}`;
  const PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%230b0b0b'/><text x='50%' y='54%' fill='%23555' font-size='20' text-anchor='middle'>image</text></svg>";

  // init EmailJS
  try { emailjs.init(EMAILJS_PUBLIC_KEY); debug("EmailJS ready"); } catch(e){ debug("EmailJS failed"); }

  const overlay=$("#age-check"),yes=$("#yesBtn"),no=$("#noBtn");
  overlay.style.display="grid";
  yes.onclick=e=>{e.preventDefault();overlay.style.display="none"};
  no.onclick=e=>{e.preventDefault();alert("Sorry, you must be 21+");location.href="https://google.com"};

  let idVerified=false,cart=[];

  const verifyDot=$("#verify-dot"),checkoutBtn=$("#checkout-btn"),checkoutNote=$("#checkout-note");
  const scanBtn=$("#scan-id-btn"),idFront=$("#id-front"),idBack=$("#id-back"),markVerified=$("#mark-verified");

  function onVerified(){
    idVerified=true;
    verifyDot.classList.remove("pulse");
    verifyDot.style.background="var(--ok)";
    checkoutBtn.disabled=false;
    checkoutNote.textContent="✅ ID verified, checkout unlocked";
  }

  markVerified.onclick=()=>{
    if(!idFront.files[0]||!idBack.files[0]){alert("Upload both ID sides");return;}
    onVerified();
  };

  scanBtn.onclick=()=>{onVerified();}; // simplified fallback (Scandit loads asynchronously)

  async function loadProducts(){
    const list=$("#product-list");
    list.innerHTML="";
    const snap=await db.collection("products").get();
    if(snap.empty){list.innerHTML="<p class='muted'>No products yet.</p>";return;}
    for(const doc of snap.docs){
      const p={id:doc.id,...doc.data()};
      const url=p.image?await storage.ref(p.image).getDownloadURL():PLACEHOLDER;
      const div=document.createElement("div");
      div.className="product";
      div.innerHTML=`<img src="${url}" alt="${p.name}"><div class="pad"><h3>${p.name}</h3><p>${fmt(p.price)}</p><button class="btn add-btn">Add to Cart</button></div>`;
      div.querySelector(".add-btn").onclick=()=>addCart(p,url);
      list.append(div);
    }
  }

  function addCart(p,url){
    const i=cart.findIndex(x=>x.id===p.id);
    if(i>=0)cart[i].qty++;else cart.push({...p,imageURL:url,qty:1});
    renderCart(); sound();
  }

  function sound(){
    try{
      const ctx=new(AudioContext)();const o=ctx.createOscillator(),g=ctx.createGain();
      o.type="square";o.frequency.value=700;g.gain.value=0.02;o.connect(g);g.connect(ctx.destination);o.start();
      setTimeout(()=>{o.stop();ctx.close();},120);
    }catch{}
  }

  function renderCart(){
    const items=$("#cart-items");items.innerHTML="";
    cart.forEach(c=>{
      const e=document.createElement("div");e.className="cart-item";
      e.innerHTML=`<img src="${c.imageURL||PLACEHOLDER}"><div><strong>${c.name}</strong><div class='muted small'>${fmt(c.price)}</div><div class='qty'><button>-</button><span>${c.qty}</span><button>+</button></div></div><button class='icon-btn'>🗑</button>`;
      const[b,,a]=e.querySelectorAll(".qty button");const del=e.querySelector(".icon-btn");
      b.onclick=()=>{c.qty--;if(c.qty<=0)cart=cart.filter(x=>x.id!==c.id);renderCart()};
      a.onclick=()=>{c.qty++;renderCart()};
      del.onclick=()=>{cart=cart.filter(x=>x.id!==c.id);renderCart()};
      items.append(e);
    });
    $("#total").textContent=fmt(cart.reduce((s,i)=>s+i.price*i.qty,0));
    $("#cart-count").textContent=cart.reduce((s,i)=>s+i.qty,0);
  }

  $("#cart-btn").onclick=()=>$("#cart").classList.remove("hidden");
  $("#close-cart").onclick=()=>$("#cart").classList.add("hidden");

  checkoutBtn.onclick=async()=>{
    if(!idVerified){alert("Verify ID first.");return;}
    if(cart.length===0){alert("Cart empty.");return;}
    const n=$("#cust-name").value,p=$("#cust-phone").value,a=$("#cust-address").value;
    if(!n||!p||!a){alert("Enter name, phone, address.");return;}
    const items=cart.map(i=>`${i.name} x${i.qty} — ${fmt(i.price*i.qty)}`).join("\n");
    const total=fmt(cart.reduce((s,i)=>s+i.price*i.qty,0));
    $("#checkout-status").textContent="Sending order...";
    try{
      await emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,{name:n,phone:p,address:a,items,total});
      $("#checkout-status").textContent="Order sent ✔";
      cart=[];renderCart();$("#cart").classList.add("hidden");
   
