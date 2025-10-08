const productList = document.getElementById("product-list");
const cartPopup = document.getElementById("cart-popup");
const cartBtn = document.getElementById("cartBtn");
const closeCart = document.getElementById("closeCart");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartItemsList = document.getElementById("cart-items");
const cartTotalText = document.getElementById("cart-total");

let cart = [];

// Show the cart popup
cartBtn.onclick = () => {
  cartPopup.classList.remove("hidden");
  renderCart();
};

// Close the cart popup
closeCart.onclick = () => {
  cartPopup.classList.add("hidden");
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
