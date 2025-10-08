// script.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("JavaScript loaded successfully ✅");

  // --- AGE VERIFICATION (unchanged) ---
  const ageCheck = document.getElementById("age-check");
  const yesBtn = document.getElementById("yesBtn");
  const noBtn = document.getElementById("noBtn");

  if (yesBtn && noBtn && ageCheck) {
    yesBtn.addEventListener("click", () => {
      ageCheck.style.display = "none";
      localStorage.setItem("ageVerified", "true");
    });

    noBtn.addEventListener("click", () => {
      alert("Sorry, you must be 21 or older to enter this site.");
      window.location.href = "https://www.google.com";
    });

    if (localStorage.getItem("ageVerified") === "true") {
      ageCheck.style.display = "none";
    }
  }

  // --- CART FUNCTIONALITY ---
  const cartBtn = document.getElementById("cart-btn");
  const cartSection = document.getElementById("cart");
  const cartItemsList = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");
  const checkoutBtn = document.getElementById("checkout-btn");

  let cart = [];

  // Update the cart display
  function updateCart() {
    if (!cartItemsList || !cartCount) return;
    cartItemsList.innerHTML = "";
    cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.classList.add("cart-item");
      li.innerHTML = `
        <span>${item.name} - $${item.price.toFixed(2)}</span>
        <button class="remove-btn">Remove</button>
      `;
      li.querySelector(".remove-btn").addEventListener("click", () => {
        cart.splice(index, 1);
        updateCart();
      });
      cartItemsList.appendChild(li);
    });
    cartCount.textContent = cart.length;
  }

  // Show/hide cart section
  if (cartBtn && cartSection) {
    cartBtn.addEventListener("click", () => {
      cartSection.classList.toggle("active");
    });
  }

  // --- PRODUCT LIST ---
  const productList = document.getElementById("product-list");
  if (productList) {
    const products = [
      { id: 1, name: "Disposable Vape", price: 19.99 },
      { id: 2, name: "Vape Juice", price: 14.99 },
      { id: 3, name: "Coil", price: 9.99 },
      { id: 4, name: "Battery", price: 24.99 },
    ];

    // Create product cards dynamically
    products.forEach((product) => {
      const div = document.createElement("div");
      div.classList.add("product");
      div.innerHTML = `
        <h3>${product.name}</h3>
        <p>$${product.price.toFixed(2)}</p>
        <button class="add-to-cart">Add to Cart</button>
      `;
      div.querySelector(".add-to-cart").addEventListener("click", () => {
        cart.push(product);
        updateCart();
      });
      productList.appendChild(div);
    });
  }

  // --- CHECKOUT BUTTON ---
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }
      alert("Thank you for your order!");
      cart = [];
      updateCart();
    });
  }
});
