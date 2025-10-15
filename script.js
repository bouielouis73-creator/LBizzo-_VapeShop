document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ LBizzo Vape Shop running...");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- AGE VERIFICATION ----------
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

  // ---------- CART ----------
  const cartBtn = $("#cart-btn");
  const cartCount = $("#cart-count");
  const cartSection = $("#cart");
  const cartItems = $("#cart-items");
  const totalEl = $("#total");
  const closeCart = $("#close-cart");
  const checkoutBtn = $("#checkout-btn");
  const cart = [];

  const updateCart = () => {
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <p>${item.name} - $${item.price.toFixed(2)}</p>
        <button data-i="${i}" class="remove">Remove</button>
      `;
      total += item.price;
      cartItems.appendChild(div);
    });
    totalEl.textContent = total.toFixed(2);
    cartCount.textContent = cart.length;
    $$(".remove").forEach(btn => btn.onclick = e => {
      const i = +e.target.dataset.i;
      cart.splice(i, 1);
      updateCart();
    });
  };

  cartBtn.onclick = () => cartSection.classList.remove("hidden");
  closeCart.onclick = () => cartSection.classList.add("hidden");
  checkoutBtn.onclick = () => alert("🛒 Checkout coming soon!");

  // ---------- FIREBASE PRODUCTS ----------
  const productList = $("#product-list");

  async function getImageURL(path) {
    try {
      return await storage.ref(path).getDownloadURL();
    } catch (err) {
      console.warn("⚠️ Image not found:", path, err);
      return "https://via.placeholder.com/150?text=No+Image";
    }
  }

  async function loadProducts() {
    try {
      const snap = await db.collection("products").get(); // ✅ lowercase collection
      productList.innerHTML = "";

      if (snap.empty) {
        productList.innerHTML = "<p>No products found in Firebase.</p>";
        return;
      }

      for (const doc of snap.docs) {
        const p = doc.data();
        const imgURL = p.image ? await getImageURL(p.image) : "https://via.placeholder.com/150?text=No+Image";

        const card = document.createElement("div");
        card.className = "product";
        card.innerHTML = `
          <img src="${imgURL}" alt="${p.name}" />
          <h3>${p.name}</h3>
          <p>$${Number(p.price).toFixed(2)}</p>
          <button class="add-btn">Add to Cart</button>
        `;

        card.querySelector(".add-btn").onclick = () => {
          cart.push({ ...p, image: imgURL });
          updateCart();
          const clickSound = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_c3eabf52f8.mp3");
          clickSound.play();
        };

        productList.appendChild(card);
      }

      console.log("🔥 Products loaded from Firestore!");
    } catch (err) {
      console.error("❌ Failed to load products:", err);
      productList.innerHTML = "<p>Error loading products.</p>";
    }
  }

  loadProducts();
});
