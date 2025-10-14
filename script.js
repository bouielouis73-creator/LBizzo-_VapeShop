// ---------- Firebase Setup ----------
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

// ---------- Your Keys ----------
const KEYS = {
  public:  "/* paste your EmailJS public key here */",
  service: "/* paste your EmailJS service ID here */",
  template:"/* paste your EmailJS template ID here */",
  square:  "/* paste your Square checkout link here */",
  scandit: "/* paste your Scandit license key here */"
};

// Initialize EmailJS
emailjs.init(KEYS.public);

// ---------- Helper ----------
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// ---------- Age Check ----------
$("#yesBtn").onclick = () => $("#age-check").style.display = "none";
$("#noBtn").onclick = () => { alert("Sorry, you must be 21+ to enter."); window.location.href="https://google.com"; };

// ---------- Load Products (Firestore + Storage `/products/`) ----------
const productList = $("#product-list");
async function getImageURL(path){
  if(!path) return null;
  if(path.startsWith("http")) return path;
  try {
    return await storage.ref("products/"+path).getDownloadURL();
  } catch {
    console.warn("Image missing:", path);
    return null;
  }
}
async function addProductCard(p){
  const url = await getImageURL(p.image);
  const card = document.createElement("div");
  card.className="product";
  card.innerHTML=`
    <img src="${url||""}" alt="${p.name}">
    <h3>${p.name}</h3>
    <p>$${(Number(p.price)||0).toFixed(2)}</p>
    <button class="btn primary add">Add to Cart</button>`;
  card.querySelector(".add").onclick=()=>addToCart(p);
  productList.appendChild(card);
}
async function loadProducts(){
  const snap = await db.collection("products").get();
  snap.forEach(async d=>{
    const data=d.data();
    await addProductCard(data);
  });
}
loadProducts();

// ---------- Cart ----------
let cart=[];
function renderCart(){
  const ul=$("#cart-items");
  ul.innerHTML="";
  let total=0;
  cart.forEach((p,i)=>{
    total+=(p.price*p.qty);
    const li=document.createElement("li");
    li.innerHTML=`
      ${p.name} - $${p.price} × ${p.qty}
      <button data-i="${i}" class="btn">Remove</button>`;
    li.querySelector("button").onclick=()=>{cart.splice(i,1);renderCart();};
    ul.appendChild(li);
  });
  $("#cart-count").textContent=cart.length;
  $("#cart-total").textContent=total.toFixed(2);
}
function addToCart(p){
  const f=cart.find(x=>x.name===p.name);
  if(f)f.qty++;else cart.push({...p,qty:1});
  renderCart();
}
$("#clearCart").onclick=()=>{cart=[];renderCart();};

// ---------- Loyalty Stars ----------
let stars=parseInt(localStorage.getItem("stars")||"0");
function renderStars(){
  const s=$$("#loyalty-stars .star");
  s.forEach((x,i)=>x.classList.toggle("active",i<stars));
}
function addStar(){stars++;if(stars>6)stars=1;localStorage.setItem("stars",stars);renderStars();}
renderStars();

// ---------- ID Scanner (Scandit) ----------
let frontData=null, backData=null, verified=false;
$("#startCamBtn").onclick=async()=>{
  const stream=await navigator.mediaDevices.getUserMedia({video:true});
  $("#scanVideo").srcObject=stream;
};
function captureFrame(){
  const v=$("#scanVideo");
  const c=document.createElement("canvas");
  c.width=v.videoWidth;c.height=v.videoHeight;
  c.getContext("2d").drawImage(v,0,0);
  return c.toDataURL("image/jpeg");
}
$("#snapFront").onclick=()=>{frontData=captureFrame();updateVerify();};
$("#snapBack").onclick=()=>{backData=captureFrame();updateVerify();};
function updateVerify(){
  verified=!!(frontData&&backData);
  $("#scanOut").textContent=verified?"Status: Verified ✅":"Status: Not verified.";
  $("#checkoutBtn").disabled=!verified||!cart.length;
}

// ---------- Checkout ----------
$("#checkoutBtn").onclick=async()=>{
  const name=$("#custName").value, phone=$("#custPhone").value, address=$("#custAddress").value;
  const items=cart.map(p=>`${p.name} × ${p.qty}`).join("\n");
  const total=$("#cart-total").textContent;
  if(!(name&&phone&&address&&verified)) return alert("Complete all info & verify ID first.");
  await emailjs.send(KEYS.service,KEYS.template,{name,phone,address,items,total});
  addStar();
  if(KEYS.square)window.location.href=KEYS.square;
  alert("Order sent! Thank you.");
  cart=[];renderCart();
};
