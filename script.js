// script.js
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ LBizzo Vape Shop booting...");

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Elements ----------
  const ageCheck = $("#age-check");
  const yesBtn = $("#yesBtn");
  const noBtn = $("#noBtn");
  const productList = $("#product-list");
  const cartBtn = $("#cartBtn");
  const cartPopup = $("#cart-popup");
  const cartItems = $("#cart-items");
  const cartTotal = $("#cart-total");
  const checkoutBtn = $("#checkoutBtn");
  const keepShopping = $("#keepShopping");
  const clearCart = $("#clearCart");
  const nameInput = $("#cust-name");
  const addressInput = $("#cust-address");
  const phoneInput = $("#cust-phone");

  // ---------- Age Verification ----------
  yesBtn.addEventListener("click", () => {
    localStorage.setItem("ageVerified", "true");
    ageCheck.style.display = "none";
  });

  noBtn.addEventListener("click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    window.location.href = "https://google.com";
  });

  if (localStorage.getItem("ageVerified") === "true") {
    ageCheck.style.display = "none";
  }

  // ---------- Products ----------
  const products = [
    { id: 1, name: "Foger Blueberry Watermelon", price: 18.99, img: "products/vape1.jpg" },
    { id: 2, name: "Juice 60ml", price: 14.99, img: "products/juice1.jpg" },
    { id: 3, name: "Coil Pack", price: 9.99, img: "products/coil.jpg" },
  ];

  // ---------- Cart ----------
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const saveCart = () => localStorage.setItem("cart", JSON.stringify(cart));

  function updateCart() {
    cartItems.innerHTML = "";
    let total = 0;
    if (cart.length === 0) {
      cartItems.innerHTML = "<li>Your cart is empty.</li>";
      cartTotal.textContent = "Total: $0";
      return;
    }

    cart.forEach((item, index) => {
      total += item.price * item.qty;
      const li = document.createElement("li");
      li.innerHTML = `
        ${item.name} - $${item.price.toFixed(2)} × ${item.qty}
        <button class="remove-item" data-index="${index}">❌</button>
      `;
      cartItems.appendChild(li);
    });

    cartTotal.textContent = `Total: $${total.toFixed(2)}`;

    $$(".remove-item").forEach(btn =>
      btn.addEventListener("click", e => {
        const i = +e.target.dataset.index;
        cart.splice(i, 1);
        saveCart();
        updateCart();
      })
    );
  }

  // ---------- Render Products ----------
  function renderProducts() {
    productList.innerHTML = "";
    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}" class="product-img" />
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
      `;
      productList.appendChild(card);
    });

    $$(".add-to-cart").forEach(btn =>
      btn.addEventListener("click", e => {
        const id = +e.target.dataset.id;
        const product = products.find(p => p.id === id);
        const existing = cart.find(i => i.id === id);
        if (existing) existing.qty++;
        else cart.push({ ...product, qty: 1 });
        saveCart();
        updateCart();
        cartPopup.classList.remove("hidden");
      })
    );
  }

  // ---------- Cart Controls ----------
  cartBtn.addEventListener("click", () => {
    cartPopup.classList.toggle("hidden");
    updateCart();
  });

  keepShopping.addEventListener("click", () => cartPopup.classList.add("hidden"));
  clearCart.addEventListener("click", () => {
    cart = [];
    saveCart();
    updateCart();
  });

  // ---------- Customer Info ----------
  [nameInput, addressInput, phoneInput].forEach(input => {
    input.addEventListener("input", () => {
      const customer = {
        name: nameInput.value,
        address: addressInput.value,
        phone: phoneInput.value,
      };
      localStorage.setItem("customerInfo", JSON.stringify(customer));
    });
  });

  const savedCustomer = JSON.parse(localStorage.getItem("customerInfo") || "{}");
  nameInput.value = savedCustomer.name || "";
  addressInput.value = savedCustomer.address || "";
  phoneInput.value = savedCustomer.phone || "";

  // ---------- Scandit ID Verification ----------
  const SCANDIT_LICENSE_KEY = "AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRdDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDRq/3pbdNQ2wHBxXMlLL1ubSkte/FG9MLxf7J9KQC5/jlqBwhtXC8O8amwpv0g1/Txo/v8tVBMqkxkYTEZ7AeUvXC9mb0GYDlt+RdXhQedpeU+YQxcj1zzQa+pYTlx1d5laJHh3WMjL1nKzEUZlZXZpUZbxASRzM48blxXef8EtyyVCnS5X2WyBWRUGEGVfjUIiawJRFrxu31ll5ghjcpeWHsJTdTrYUGgegsdXcz6jeB0jcg6cISpkQ+vfVYZ1Cz33hCdJIpjP6YdV1txoUHPQf/9KJkImFT6XFWj6khyUHtnZjDZyyApE4bWHuMZtDzghqN30nYaX47bZQbrSELMCguYjhVRrUaA4M1IBTHMjtwTlFNFSTups1/pUFPI4mNV8ZuKuRwANY9MO4STHjdCfX6CA/xjsbBbBc+b5N1N8E70TNlAUsov2sgisR7ICqNFXG+H93QFuKd3F6nVvY8DiYOZ+7HvY5KVBkIY2Fys70JRdPyRQeCpRdEmwzReb//77uF344Wt0UZmFXSNBAOEPJdDjRvAllzC7ZRtiGYiSbGlV9yDs6Ly6XF0miq2G3pZtiTCQqdYT2/R7M0ENi4qLYDnLbfFAiux3PI/AmUsOfbWRxnKARt2pWn0vFHIdgeswEMITqF2etKjPbjzy5LDs+YxXfF+D4h//svwIUeMuOAjunsNRs2ZUpzdMGAXzUTF/YEE/upE1tRmFrDAWDKzYpb9ouoKNNPDR9SgrwhcCKk+nXbpOhiWlkZjVmBr0edch/b/2ywfMtImPqq/CWix1RSlYHse85OSKKiXaGRp6FqhBccGh7h2FVOWvgVC75c7vJ+sOvksOxhLI8IR46aAnNDHatQwBjrHeIBBbNBNUKj2u34KXvvSvC6qM7FVWKUt1b5zu2rGc4NI=";
  const SCANDIT_ENGINE = "https://cdn.jsdelivr.net/npm/scandit-sdk@5.15.0/build/";

  async function startScanner() {
    await ScanditSDK.configure(SCANDIT_LICENSE_KEY, { engineLocation: SCANDIT_ENGINE });
    const picker = await ScanditSDK.BarcodePicker.create(document.body, { playSoundOnScan: true });
    const settings = new ScanditSDK.ScanSettings();
    settings.setSymbologyEnabled(ScanditSDK.Barcode.Symbology.PDF417, true);
    await picker.applyScanSettings(settings);
    picker.on("scan", result => {
      const raw = result?.barcodes?.[0]?.data || "";
      if (raw.includes("DBB")) {
        localStorage.setItem("idVerified", "true");
        picker.destroy();
        alert("✅ ID Verified!");
        proceedCheckout();
      } else {
        alert("❌ Could not verify ID. Try again.");
      }
    });
  }

  // ---------- Checkout ----------
  checkoutBtn.addEventListener("click", async () => {
    if (cart.length === 0) return alert("Your cart is empty!");
    if (!localStorage.getItem("idVerified")) {
      alert("Please verify your ID first.");
      return startScanner();
    }
    proceedCheckout();
  });

  function proceedCheckout() {
    const link = "https://square.link/u/QjyYzLGK";
    const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);
    alert(`Redirecting to Square Checkout. Total: $${total}`);
    window.location.href = link;
  }

  // ---------- Init ----------
  renderProducts();
  updateCart();
  console.log("✅ LBizzo ready for Netlify deployment.");
});
