// Test connection
console.log("Script running ✅");
// Check if the buttons exist
console.log("yesBtn:", document.getElementById("yesBtn"));
console.log("noBtn:", document.getElementById("noBtn"));
console.log("cartBtn:", document.getElementById("cartBtn"));
// Get elements
const cartBtn = document.getElementById("cartBtn");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const cartPopup = document.getElementById("cart-popup");
const closeCart = document.getElementById("closeCart");

// Button actions
yesBtn.onclick = () => {
  document.getElementById("age-check").style.display = "none";
};

noBtn.onclick = () => {
  alert("You must be 21 or older to enter this site.");
  window.location.href = "https://google.com";
};

cartBtn.onclick = () => {
  cartPopup.classList.remove("hidden");
};

closeCart.onclick = () => {
  cartPopup.classList.add("hidden");
};

let cart = [];

cartBtn.onclick = () => {
  cartPopup.classList.add("show");
  renderCart();
};

closeCart.onclick = () => {
  cartPopup.classList.remove("show");
};

let cart = [];

// Age verification
document.getElementById("yesBtn").onclick = () => {
  document.getElementById("age-check").style.display = "none";
};
document.getElementById("noBtn").onclick = () => {
  alert("You must be 21 or older to enter this site.");
  window.location.href = "https://google.com";
};

// Load products from Firestore
db.collection("products").onSnapshot(snapshot => {
  productList.innerHTML = "";
  snapshot.forEach(doc => {
    const p = doc.data();
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="${p.image}" width="200">
      <h3>${p.name}</h3>
      <p>$${p.price}</p>
      <button onclick="addToCart('${doc.id}', '${p.name}', ${p.price}, '${p.image}')">Add to Cart</button>
    `;
    productList.appendChild(div);
  });
});

function addToCart(id, name, price, image) {
  cart.push({ id, name, price, image });
  alert(`${name} added to cart`);
}

cartBtn.onclick = () => {
  cartPopup.classList.remove("hidden");
  renderCart();
};

closeCart.onclick = () => cartPopup.classList.add("hidden");

function renderCart() {
  const list = document.getElementById("cart-items");
  const total = document.getElementById("cart-total");
  list.innerHTML = "";
  let sum = 0;
  cart.forEach((item, i) => {
    sum += item.price;
    const li = document.createElement("li");
    li.innerHTML = `${item.name} - $${item.price.toFixed(2)} 
  <button onclick="deleteItem(${i})">❌</button>`;
    list.appendChild(li);
  });
  total.textContent = `Total: $${sum.toFixed(2)}`;
}

function deleteItem(index) {
  cart.splice(index, 1);
  renderCart();
}

checkoutBtn.onclick = async () => {
  await fetch("/.netlify/functions/send-sms", { method: "POST" });
  alert("Order placed! You'll receive a confirmation text soon.");
  cart = [];
  renderCart();
};
