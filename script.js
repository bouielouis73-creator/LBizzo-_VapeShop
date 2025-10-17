document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const overlay = $("#age-check"), yes = $("#yesBtn"), no = $("#noBtn");
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    yes.onclick = () => overlay.style.display = "none";
    no.onclick = () => { alert("Sorry, 21+ only."); location.href = "https://google.com"; };
  }

  // Firestore & Storage
  const db = firebase.firestore();
  const storage = firebase.storage();
  const productList = $("#product-list");

  // EmailJS init
  emailjs.init("jUx6gEqKI1tvL7yLs");

  let cart = [];
  let verified = false;

  async function loadProducts() {
    productList.innerHTML = "";
    const snap = await db.collection("products").get();
    if (snap.empty) {
      productList.innerHTML = "<p>No products found.</p>";
      return;
    }
    for (const doc of snap.docs) {
      const p = doc.data();
      const imgURL = await window.getStorageURL(p.image);
      const card = document.createElement("div");
      card.className = "product";
      card.innerHTML = `
        <img src="${imgURL}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>$${Number(p.price).toFixed(2)}</p>
        <button>Add to Cart</button>
      `;
      card.querySelector("button").onclick = () => addToCart(p);
      productList.appendChild(card);
    }
  }

  function addToCart(p) {
    cart.push(p);
    updateCart();
  }

  function updateCart() {
    const cartItems = $("#cart-items");
    const totalEl = $("#total");
    const cartCount = $("#cart-count");
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach((p, i) => {
      total += Number(p.price);
      const li = document.createElement("li");
      li.innerHTML = `${p.name} - $${p.price.toFixed(2)} <button data-i="${i}">x</button>`;
      li.querySelector("button").onclick = e => {
        cart.splice(e.target.dataset.i, 1);
        updateCart();
      };
      cartItems.appendChild(li);
    });
    totalEl.textContent = "Total: $" + total.toFixed(2);
    cartCount.textContent = cart.length;
    $("#checkout-btn").disabled = !verified || cart.length === 0;
  }

  $("#cart-btn").onclick = () => $("#cart").classList.toggle("hidden");
  $("#close-cart").onclick = () => $("#cart").classList.add("hidden");

  $("#verify-id").onclick = async () => {
    // placeholder for Scandit; simulate verify success
    alert("ID verified ✅");
    verified = true;
    $("#checkout-btn").disabled = false;
  };

  $("#checkout-btn").onclick = async () => {
    if (!verified) return alert("Please verify ID first.");
    if (!cart.length) return alert("Your cart is empty.");

    const total = cart.reduce((sum, p) => sum + Number(p.price), 0);
    const items = cart.map(p => `${p.name} - $${p.price}`).join("\n");
    try {
      await emailjs.send("service_7o2u4kq", "template_6jlkofi", {
        to_email: "lbizzocustomers@outlook.com",
        items,
        total: total.toFixed(2)
      });
      alert("✅ Order sent!");
      cart = [];
      updateCart();
      $("#cart").classList.add("hidden");
    } catch (e) {
      console.error(e);
      alert("❌ Email failed.");
    }
  };

  await loadProducts();
});
