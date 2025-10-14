document.addEventListener("DOMContentLoaded", async () => {
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
  const scanSection = $("#id-scan-section");
  const videoEl = $("#id-video");
  const msg = $("#id-message");
  const cancelBtn = $("#id-cancel");

  // ---------- AGE CHECK ----------
  overlay.style.display = "grid";
  yes.addEventListener("click", async (e) => {
    e.preventDefault();
    overlay.style.display = "none";
    await loadProducts(); // only load Firebase products after age confirmed
  });
  no.addEventListener("click", (e) => {
    e.preventDefault();
    alert("Sorry, you must be 21+ to enter.");
    window.location.href = "https://google.com";
  });

  // ---------- FIREBASE ----------
  const db = firebase.firestore();
  const storage = firebase.storage();

  async function getImageURL(path) {
    try {
      if (path.startsWith("http")) return path;
      return await storage.ref(path).getDownloadURL();
    } catch {
      return "https://via.placeholder.com/150?text=No+Image";
    }
  }

  async function loadProducts() {
    try {
      const snap = await db.collection("products").get();
      productList.innerHTML = "";
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
          <img src="${imgURL}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p>$${Number(p.price).toFixed(2)}</p>
          <button class="add-btn">Add to Cart</button>
        `;
        card.querySelector(".add-btn").addEventListener("click", () => addToCart(p));
        productList.appendChild(card);
      });
    } catch (err) {
      console.error("Error loading products:", err);
      productList.innerHTML = "<p>Error loading products.</p>";
    }
  }

  // ---------- CART ----------
  let cart = [];

  function updateCartDisplay() {
    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach((p, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${p.name} - $${Number(p.price).toFixed(2)}
        <button class="remove-btn" data-i="${i}">x</button>
      `;
      cartItems.appendChild(li);
      total += Number(p.price);
    });

    totalEl.textContent = `Total: $${total.toFixed(2)}`;
    cartCount.textContent = cart.length;

    $$(".remove-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
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

  // ---------- ID SCAN ----------
  cancelBtn.addEventListener("click", () => {
    scanSection.classList.add("hidden");
    if (window._scannerStream) window._scannerStream.getTracks().forEach(t => t.stop());
  });

  async function startIDScan() {
    try {
      
      msg.textContent = "Opening camera...";
scanSection.classList.remove("active");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoEl.srcObject = stream;
      window._scannerStream = stream;

      // Wait 2.5s then capture frame
      await new Promise(r => setTimeout(r, 2500));
      const canvas = document.createElement("canvas");
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoEl, 0, 0);
      const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg"));

      msg.textContent = "Verifying ID...";
      const res = await fetch("/.netlify/functions/verify-id", {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob
      });
      const { verified } = await res.json();

      // stop camera
      if (window._scannerStream) window._scannerStream.getTracks().forEach(t => t.stop());

      scanSection.classList.add("active");

      if (verified) {
        alert("✅ ID verified! Proceeding to checkout...");
        proceedCheckout();
      } else {
        alert("❌ Sorry, you must be 21+.");
      }
    } catch (err) {
      console.error("Scanner error:", err);
      alert("Camera not available or permission denied.");
      scanSection.classList.add("hidden");
    }
  }

  // Run ONLY when pressing Checkout
  checkoutBtn.addEventListener("click", async () => {
    if (cart.length === 0) return alert("Your cart is empty!");
    startIDScan();
  });

  async function proceedCheckout() {
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
  }
});
