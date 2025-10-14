document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_BOOTED__) return;
  window.__LBIZZO_BOOTED__ = true;
  console.log("✅ LBizzo Vape Shop starting...");

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debug = (msg) => { const bar = $("#debug"); if (bar) { bar.textContent = msg; bar.hidden = false; } console.log(msg); };

  // ---------- Age Verification ----------
  const overlay = $("#age-check");
  const yes = $("#yesBtn");
  const no = $("#noBtn");

  if (overlay && yes && no) {
    overlay.style.display = "grid";
    yes.addEventListener("click", (e) => {
      e.preventDefault();
      overlay.style.display = "none";
    });
    no.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Sorry, you must be 21+ to enter.");
      window.location.href = "https://google.com";
    });
  }

  // ---------- Firebase Setup ----------
  const db = firebase.firestore();
  const storage = firebase.storage();
  const productList = $("#product-list");

  async function getImageURL(path) {
    try {
      return await storage.ref(path).getDownloadURL();
    } catch (err) {
      console.warn("Image load failed:", path, err);
      return "https://via.placeholder.com/150?text=No+Image";
    }
  }

  async function loadProducts() {
    productList.innerHTML = "";
    try {
      const snap = await db.collection("products").get();
      if (snap.empty) {
        productList.innerHTML = "<p>No products found.</p>";
        return;
      }

      snap.forEach(async (doc) => {
        const p = doc.data();
        const imgURL = await getImageURL(p.image);
        const card = document.createElement("div");
        card.className = "product";
        card.innerHTML = `
          <img src="${imgURL}" alt="${p.name}" />
          <h3>${p.name}</h3>
          <p>$${Number(p.price).toFixed(2)}</p>
          <button class="add-btn">Add to Cart</button>
        `;
        card.querySelector(".add-btn").addEventListener("click", () => addToCart(p));
        productList.appendChild(card);
      });
      debug("✅ Products loaded from Firestore");
    } catch (err) {
      console.error("Failed to load products", err);
      productList.innerHTML = "<p>Error loading products.</p>";
    }
  }

  // ---------- Cart ----------
  let cart = [];
  const cartBtn = $("#cart-btn");
  const cartSection = $("#cart");
  const cartItems = $("#cart-items");
  const totalEl = $("#total");
  const closeCart = $("#close-cart");

  function updateCartDisplay() {
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach((p, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${p.name} - $${Number(p.price).toFixed(2)}
        <button data-i="${i}" class="remove-btn">x</button>
      `;
      cartItems.appendChild(li);
      total += Number(p.price);
    });
    totalEl.textContent = `Total: $${total.toFixed(2)}`;
    $("#cart-count").textContent = cart.length;
    $$(".remove-btn").forEach(btn =>
      btn.addEventListener("click", e => {
        cart.splice(e.target.dataset.i, 1);
        updateCartDisplay();
      })
    );
  }

  function addToCart(p) {
    cart.push(p);
    updateCartDisplay();
  }

  cartBtn.addEventListener("click", () => cartSection.classList.toggle("hidden"));
  closeCart.addEventListener("click", () => cartSection.classList.add("hidden"));

  // ---------- Checkout (EmailJS) ----------
  $("#checkout-btn").addEventListener("click", () => {
    if (cart.length === 0) return alert("Cart is empty!");
    const orderDetails = cart.map(p => `${p.name} - $${p.price}`).join("\n");
    const total = cart.reduce((a, b) => a + Number(b.price), 0);
    emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
      items: orderDetails,
      total: total.toFixed(2)
    }).then(() => {
      alert("✅ Order sent successfully!");
      cart = [];
      updateCartDisplay();
      cartSection.classList.add("hidden");
    }).catch(err => {
      alert("❌ Failed to send order. Check console.");
      console.error(err);
    });
  });

  // ---------- Start ----------
  await loadProducts();
});
