document.addEventListener("DOMContentLoaded", () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo JS booting…");

  // ---------- HELPERS ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- AGE VERIFICATION ----------
  const ageCheck = $("#age-check");
  const yesBtn = $("#yesBtn");
  const noBtn = $("#noBtn");

  yesBtn.addEventListener("click", () => {
    ageCheck.style.display = "none";
  });
  noBtn.addEventListener("click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    window.location.href = "https://google.com";
  });

  // ---------- CART SYSTEM ----------
  const cartBtn = $("#cart-btn");
  const cartSection = $("#cart");
  const cartItemsList = $("#cart-items");
  const cartCount = $("#cart-count");
  const checkoutBtn = $("#checkout-btn");
  const totalDisplay = $("#cart-total");

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  function updateCartUI() {
    cartItemsList.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
      const li = document.createElement("li");
      li.innerHTML = `${item.name} - $${item.price.toFixed(2)} 
      <button class="remove-btn" data-index="${i}">❌</button>`;
      cartItemsList.appendChild(li);
      total += item.price;
    });
    totalDisplay.textContent = `Total: $${total.toFixed(2)}`;
    cartCount.textContent = cart.length;
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  cartItemsList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-btn")) {
      const index = e.target.dataset.index;
      cart.splice(index, 1);
      updateCartUI();
    }
  });

  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    alert("🛒 Checkout complete!");
    addLoyaltyStar(); // ⭐ Add a loyalty star after every checkout
    cart = [];
    updateCartUI();
  });

  // ---------- FIRESTORE PRODUCTS ----------
const productList = $("#product-list");

db.collection("products")
  .get()
  .then((snapshot) => {
    productList.innerHTML = ""; // clear old placeholders
    snapshot.forEach((doc) => {
      const p = doc.data();

      const div = document.createElement("div");
      div.className = "product";
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}" style="width:100%;border-radius:10px;">
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button class="add-btn">Add to Cart</button>
      `;

      div.querySelector(".add-btn").addEventListener("click", () => {
        cart.push(p);
        updateCartUI();
      });

      productList.appendChild(div);
    });
  })
  .catch((err) => {
    console.error("Error loading products:", err);
    productList.innerHTML = "<p style='color:red;'>⚠️ Could not load products</p>";
  });

  const productList = $("#product-list");

  products.forEach((p) => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>$${p.price.toFixed(2)}</p>
      <button class="add-btn">Add to Cart</button>
    `;
    div.querySelector(".add-btn").addEventListener("click", () => {
      cart.push(p);
      updateCartUI();
    });
    productList.appendChild(div);
  });

  // ---------- LOYALTY STARS ----------
  const stars = document.querySelectorAll("#loyalty-stars .star");
  let loyaltyCount = parseInt(localStorage.getItem("loyaltyCount") || "0");

  function updateLoyaltyStars() {
    stars.forEach((star, i) => {
      star.classList.toggle("active", i < loyaltyCount);
    });
  }

  function addLoyaltyStar() {
    loyaltyCount++;
    if (loyaltyCount >= 6) {
      alert("🎉 Congrats! You’ve earned a free vape!");
      loyaltyCount = 0;
    }
    localStorage.setItem("loyaltyCount", loyaltyCount);
    updateLoyaltyStars();
  }

  updateLoyaltyStars();
});
