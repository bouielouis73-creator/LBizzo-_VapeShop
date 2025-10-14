document.addEventListener("DOMContentLoaded", async () => {
  if (window.__LBIZZO_LOADED__) return;
  window.__LBIZZO_LOADED__ = true;

  console.log("✅ LBizzo Vape Shop running...");

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // ---------- AGE VERIFICATION ----------
  const overlay = $("#age-check");
  const yes = $("#yesBtn");
  const no = $("#noBtn");

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

  // ---------- FIREBASE ----------
  const db = firebase.firestore();
  const storage = firebase.storage();
  const productList = $("#product-list");

  async function getImageURL(path) {
    try {
      return await storage.ref(path).getDownloadURL();
    } catch {
      return "https://via.placeholder.com/150?text=No+Image";
    }
  }

  async function getImageURL(path) {
  try {
    // If it's already a full URL, just return it directly
    if (path.startsWith("http")) return path;
    // Otherwise, fetch from Firebase Storage
    return await storage.ref(path).getDownloadURL();
  } catch (err) {
    console.warn("⚠️ Could not load image:", path, err);
    return "https://via.placeholder.com/150?text=No+Image";
  }
}

  // ---------- CART ----------
  let cart = [];
  const cartBtn = $("#cart-btn");
  const cartCount = $("#cart-count");
  const cartSection = $("#cart");
  const cartItems = $("#cart-items");
  const totalEl = $("#total");
  const closeCart = $("#close-cart");
  const checkoutBtn = $("#checkout-btn");

  function updateCartDisplay() {
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach((p, i) => {
      const li = document.createElement("li");
      li.innerHTML = `${p.name} - $${Number(p.price).toFixed(2)}
      <button class="remove-btn" data-i="${i}">x</button>`;
      cartItems.appendChild(li);
      total += Number(p.price);
    });
    totalEl.textContent = `Total: $${total.toFixed(2)}`;
    cartCount.textContent = cart.length;
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

  cartBtn.addEventListener("click", () => {
    cartSection.classList.toggle("hidden");
  });

  closeCart.addEventListener("click", () => {
    cartSection.classList.add("hidden");
  });

  checkoutBtn.addEventListener("click", async () => {
    if (cart.length === 0) return alert("Your cart is empty!");
    const orderDetails = cart.map(p => `${p.name} - $${p.price}`).join("\n");
    const total = cart.reduce((sum, p) => sum + Number(p.price), 0);

    try {
      await emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
        items: orderDetails,
        total: total.toFixed(2)
      });
      alert("✅ Order sent successfully!");
      cart = [];
      updateCartDisplay();
      cartSection.classList.add("hidden");
    } catch (err) {
      alert("❌ Failed to send order. Check console.");
      console.error(err);
    }
  });

  await loadProducts();
});
