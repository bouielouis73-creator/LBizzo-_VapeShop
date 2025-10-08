// script.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("JavaScript loaded successfully ✅");

  // --- Age check section ---
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

    // Keep it hidden if already verified
    if (localStorage.getItem("ageVerified") === "true") {
      ageCheck.style.display = "none";
    }
  }

  // --- Cart system ---
  const cartBtn = document.getElementById("cart-btn");
  const cartSection = document.getElementById("cart");
  const cartItemsList = document.getElementById("cart-items");
  const cartCount = document.getElementById("cart-count");

  let cart = [];

  function updateCart() {
    cartItemsList.innerHTML = "";
    cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.textContent = `${item.name} - $${item.price}`;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        cart.splice(index, 1);
        updateCart();
      });
      li.appendChild(removeBtn);
      cartItemsList.appendChild(li);
    });
    cartCount.textContent = cart.length;
  }

  if (cartBtn && cartSection) {
    cartBtn.addEventListener("click", () => {
      cartSection.classList.toggle("visible");
    });
  }

  // --- Product list ---
  const productList = document.getElementById("product-list");
  if (productList) {
    const products = [
      { name: "Disposable Vape", price: 19.99 },
      { name: "Vape Juice", price: 14.99 },
      { name: "Coil", price: 9.99 },
      { name: "Battery", price: 24.99 },
    ];

    products.forEach((p) => {
      const div = document.createElement("div");
      div.className = "product";
      div.innerHTML = `
        <h3>${p.name}</h3>
        <p>$${p.price}</p>
        <button>Add to Cart</button>
      `;
      const btn = div.querySelector("button");
      btn.addEventListener("click", () => {
        cart.push(p);
        updateCart();
      });
      productList.appendChild(div);
    });
  }
});
