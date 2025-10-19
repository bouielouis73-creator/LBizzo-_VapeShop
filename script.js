(() => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  console.log("✅ LBizzo Vape Shop running...");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- ELEMENTS ----------
  const overlay = $("#age-check");
  const yes = $("#yesBtn");
  const no = $("#noBtn");
  const productList = $("#product-list");
  const cartBtn = $("#cart-btn");
  const cartCount = $("#cart-count");
  const cartSection = $("#cart");
  const cartItems = $("#cart-items");
  const totalEl = $("#total");
  const closeCart = $("#close-cart");
  const checkoutBtn = $("#checkout-btn");
  const keepShoppingBtn = $("#keep-shopping-btn");

  // ---------- GLOBALS ----------
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  // ---------- AGE VERIFICATION ----------
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    yes.addEventListener("click", e => {
      e.preventDefault();
      overlay.style.display = "none";
    });
    no.addEventListener("click", e => {
      e.preventDefault();
      alert("Sorry, you must be 21+ to enter.");
      window.location.href = "https://google.com";
    });
  }

  // ---------- LOAD PRODUCTS FROM FIREBASE ----------
  async function loadProducts() {
    const db = firebase.firestore();
    const storage = firebase.storage();
    const snapshot = await db.collection("products").get();

    productList.innerHTML = "";
    snapshot.forEach(async doc => {
      const p = doc.data();
      const imgRef = storage.ref(`products/${p.image}`);
      const imgURL = await imgRef.getDownloadURL().catch(() => "placeholder.png");

      const card = document.createElement("div");
      card.className = "product";
      card.innerHTML = `
        <img src="${imgURL}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p>$${p.price}</p>
        <button class="add-btn">Add to Cart</button>
      `;
      card.querySelector(".add-btn").addEventListener("click", () => addToCart(p));
      productList.appendChild(card);
    });
  }

  loadProducts();

  // ---------- CART ----------
  function updateCart() {
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach((p, i) => {
      total += Number(p.price);
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <span>${p.name}</span>
        <span>$${p.price}</span>
        <button class="remove" data-index="${i}">❌</button>
      `;
      cartItems.appendChild(row);
    });
    totalEl.textContent = `$${total.toFixed(2)}`;
    cartCount.textContent = cart.length;
    localStorage.setItem("cart", JSON.stringify(cart));

    $$(".remove").forEach(btn =>
      btn.addEventListener("click", e => {
        const i = e.target.dataset.index;
        cart.splice(i, 1);
        updateCart();
      })
    );
  }

  function addToCart(p) {
    cart.push(p);
    updateCart();
    const audio = new Audio("beep.mp3");
    audio.play().catch(() => {});
  }

  cartBtn.addEventListener("click", () => (cartSection.style.display = "block"));
  closeCart.addEventListener("click", () => (cartSection.style.display = "none"));
  keepShoppingBtn.addEventListener("click", () => (cartSection.style.display = "none"));

  updateCart();

  // ---------- ✅ SQUARE CHECKOUT CONNECTION ----------
  checkoutBtn.addEventListener("click", async () => {
    if (!cart.length) return alert("Your cart is empty!");

    try {
      const res = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // ✅ redirect to Square checkout
      } else {
        alert("Error creating checkout link");
        console.error(data);
      }
    } catch (err) {
      alert("Checkout failed, please try again.");
      console.error(err);
    }
  });

  console.log("🟧 Square checkout integrated!");
})();
