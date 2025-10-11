document.addEventListener("DOMContentLoaded", () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo JS booting…");

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const debugBar = $("#debug");
  const setDebug = (msg, ok = false) => {
    if (!debugBar) return;
    debugBar.textContent = msg;
    debugBar.style.background = ok ? "#022" : "#220";
    debugBar.style.color = ok ? "#7fffb3" : "#ff6666";
    debugBar.hidden = false;
  };

  // ---------- sanity checks ----------
  if (!window.firebase) { setDebug("Firebase SDK missing."); return; }
  if (!window.db) { setDebug("Firestore (db) not available. Check firebase.js order."); return; }

  // ---------- age check ----------
  const ageCheck = $("#age-check");
  $("#yesBtn").addEventListener("click", () => ageCheck.style.display = "none");
  $("#noBtn").addEventListener("click", () => {
    alert("Sorry, you must be 21 or older to enter.");
    location.href = "https://google.com";
  });

  // ---------- cart ----------
  const cartItemsList = $("#cart-items");
  const cartCount = $("#cart-count");
  const totalDisplay = $("#cart-total");
  const checkoutBtn = $("#checkout-btn");
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  function updateCartUI() {
    cartItemsList.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
      const li = document.createElement("li");
      total += Number(item.price) || 0;
      li.innerHTML = `${item.name} - $${(Number(item.price)||0).toFixed(2)}
        <button class="remove-btn" data-i="${i}">❌</button>`;
      cartItemsList.appendChild(li);
    });
    totalDisplay.textContent = `Total: $${total.toFixed(2)}`;
    cartCount.textContent = cart.length;
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  cartItemsList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-btn")) {
      cart.splice(Number(e.target.dataset.i), 1);
      updateCartUI();
    }
  });
  checkoutBtn.addEventListener("click", () => {
    if (!cart.length) { alert("Your cart is empty!"); return; }
    alert("🛒 Checkout complete!");
    addLoyaltyStar();            // ⭐ add a star on every purchase
    cart = [];
    updateCartUI();
  });
  updateCartUI();

  // ---------- loyalty stars ----------
  const stars = document.querySelectorAll("#loyalty-stars .star");
  let loyaltyCount = parseInt(localStorage.getItem("loyaltyCount") || "0", 10);
  function renderStars() {
    stars.forEach((s, i) => s.classList.toggle("active", i < loyaltyCount));
  }
  function addLoyaltyStar() {
    loyaltyCount++;
    if (loyaltyCount >= 6) {
      alert("🎉 Congratulations! You earned a free vape!");
      loyaltyCount = 0;
    }
    localStorage.setItem("loyaltyCount", String(loyaltyCount));
    renderStars();
  }
  renderStars();

  // ---------- load products from Firestore ("products" collection) ----------
  const productList = $("#product-list");

  db.collection("products")
    .get()
    .then((snapshot) => {
      setDebug(`Connected to Firestore • ${snapshot.size} product(s)`, true);
      if (snapshot.empty) {
        productList.innerHTML =
          "<p style='opacity:.8'>No products yet. Add docs in Firestore → products with fields: name (string), price (number), image (string URL).</p>";
        return;
      }
      productList.innerHTML = "";
      snapshot.forEach((doc) => {
        const p = doc.data();
        const priceNum = Number(p.price) || 0;
        const card = document.createElement("div");
        card.className = "product";
        card.innerHTML = `
          <img src="${p.image || ""}" alt="${p.name || "Product"}"
               onerror="this.src=''; this.style.display='none';" />
          <h3>${p.name || "Unnamed"}</h3>
          <p>$${priceNum.toFixed(2)}</p>
          <button class="add-btn">Add to Cart</button>
        `;
        card.querySelector(".add-btn").addEventListener("click", () => {
          cart.push({ name: p.name || "Item", price: priceNum, image: p.image || "" });
          updateCartUI();
        });
        productList.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("🔥 Firestore load error:", err);
      setDebug(`Firestore error: ${err.message}`);
      productList.innerHTML = "<p style='color:#ff6666'>⚠️ Could not load products</p>";
      // (Optional) fallback demo card so the UI still works
      /* const demo = {name:"Demo Vape", price:12.99};
      const card = document.createElement("div");
      card.className="product";
      card.innerHTML = `<h3>${demo.name}</h3><p>$${demo.price.toFixed(2)}</p><button class="add-btn">Add to Cart</button>`;
      card.querySelector(".add-btn").addEventListener("click",()=>{cart.push(demo);updateCartUI();});
      productList.appendChild(card); */
    });
});
