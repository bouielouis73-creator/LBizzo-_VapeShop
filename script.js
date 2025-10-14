// ---------- Products (Firestore + Storage) ----------
const productList = $("#product-list");
const PLACEHOLDER_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
    <rect width='100%' height='100%' fill='#0b0b0b'/>
    <rect x='16' y='16' width='368' height='268' rx='16' fill='#141414' stroke='#ff8c00' stroke-width='4'/>
    <text x='50%' y='55%' text-anchor='middle' font-size='28' fill='#ff8c00' font-family='Arial Black, Arial'>LBizzo</text>
  </svg>
`);

// ✅ Try to safely get the Storage URL (so broken images fallback)
async function getImageURL(storagePath) {
  if (!storagePath) return null;
  try {
    const ref = storage.ref(storagePath);
    return await ref.getDownloadURL();
  } catch (err) {
    console.warn("⚠️ Image not found in Firebase Storage:", storagePath);
    return null;
  }
}

// ✅ Create the product card for each item
async function addProductCard(p) {
  if (!productList) return;
  const imgURL = await getImageURL(p.image);
  const card = document.createElement("div");
  card.className = "product";
  card.innerHTML = `
    <img src="${imgURL || PLACEHOLDER_IMG}" alt="${p.name || "Product"}" onerror="this.src='${PLACEHOLDER_IMG}'" />
    <h3>${p.name || "Unnamed"}</h3>
    <p class="price">$${(Number(p.price) || 0).toFixed(2)}</p>
    <button class="btn primary add">Add to Cart</button>
  `;
  card.querySelector(".add")?.addEventListener("click", () => addToCart(p));
  productList.appendChild(card);
}

// ✅ Load products from Firestore
async function loadProducts() {
  if (!productList) return;
  productList.innerHTML = "";

  const collectionsToTry = ["products", "productData", "vapes", "items"];
  let snap = null;

  // Try multiple collection names automatically
  for (const name of collectionsToTry) {
    try {
      const test = await db.collection(name).limit(1).get();
      if (!test.empty) {
        console.log(`✅ Using Firestore collection: ${name}`);
        snap = await db.collection(name).limit(200).get();
        break;
      }
    } catch (err) {
      console.warn(`⚠️ Collection check failed for ${name}:`, err.message);
    }
  }

  if (!snap) {
    console.warn("⚠️ No Firestore collections found. Showing placeholders.");
    for (let i = 1; i <= 30; i++) {
      await addProductCard({ id: "ph" + i, name: `Vape #${i}`, price: 9.99, image: null });
    }
    debug("No products found — showing placeholders.", true);
    return;
  }

  // ✅ Add each Firestore product
  snap.forEach(async (doc) => {
    const d = doc.data() || {};

    // Handle different possible field names automatically
    const name = d.name || d.title || d.productName || "Unnamed";
    const price = Number(d.price || d.cost || d.amount || 0);
    const image = d.image || d.img || d.imagePath || null;

    await addProductCard({ id: doc.id, name, price, image });
  });

  debug(`✅ Loaded ${snap.size} products with images and prices.`, true);
}
