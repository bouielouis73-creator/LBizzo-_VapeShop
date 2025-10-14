// script.js (module)

import {
  DataCaptureContext, Camera, configure, DataCaptureView, loadingStatus
} from "@scandit/web-datacapture-core";
import {
  IdCapture, IdCaptureOverlay, IdDocumentType, IdCaptureSettings, idCaptureLoader
} from "@scandit/web-datacapture-id";

// ---------- GLOBALS ----------
const PLACEHOLDER_IMG = "https://via.placeholder.com/300x200?text=LBizzo";

// Expects window.db and window.storage from firebase.js (compat SDK)
const db = window.db;
const storage = window.storage;

// ---------- AGE VERIFICATION ----------
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("age-check");
  const yes = document.getElementById("yesBtn");
  const no  = document.getElementById("noBtn");
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    const allow = (e) => { e.preventDefault(); overlay.style.display = "none"; };
    const deny  = (e) => { e.preventDefault(); alert("Sorry, you must be 21+ to enter."); location.href="https://google.com"; };
    ["click","touchstart"].forEach(evt=>{
      yes.addEventListener(evt, allow, {passive:false});
      no .addEventListener(evt, deny,  {passive:false});
    });
  }
});

// ---------- HELPERS ----------
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

async function getImageURL(pathOrUrl) {
  if (!pathOrUrl) return PLACEHOLDER_IMG;
  // If looks like http(s), return as-is
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  // Otherwise treat as Storage path under /products/...
  try {
    const ref = storage.ref(pathOrUrl.startsWith("products/") ? pathOrUrl : `products/${pathOrUrl}`);
    return await ref.getDownloadURL();
  } catch (e) {
    console.warn("Image load failed for", pathOrUrl, e);
    return PLACEHOLDER_IMG;
  }
}

// ---------- PRODUCTS LIST ----------
const productList = $("#product-list");
const cartItemsEl = $("#cart-items");
const cartCountEl = $("#cart-count");
const checkoutBtn = $("#checkout-btn");
const scanIdBtn   = $("#scan-id-btn");

let CART = [];
let ID_VERIFIED = false;

function renderCart() {
  cartItemsEl.innerHTML = "";
  CART.forEach((item, idx) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.gap = "8px";
    li.innerHTML = `
      <span>${item.name} — $${Number(item.price||0).toFixed(2)}</span>
      <div>
        <button class="btn rm" data-i="${idx}" style="background:#333;color:#fff">Remove</button>
      </div>
    `;
    cartItemsEl.appendChild(li);
  });
  cartItemsEl.querySelectorAll(".rm").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      const i = Number(e.currentTarget.dataset.i);
      CART.splice(i,1);
      cartCountEl.textContent = String(CART.length);
      renderCart();
    });
  });
  updateCheckoutState();
}

function updateCheckoutState() {
  // Checkout unlocked only if cart has items and ID verified
  checkoutBtn.disabled = !(CART.length && ID_VERIFIED);
  scanIdBtn.textContent = ID_VERIFIED ? "✅ ID Verified" : "🔓 Scan ID to Unlock Checkout";
}

async function addCard(p) {
  const priceNum = Number(p.price) || 0;
  const imgURL = await getImageURL(p.image);
  const card = document.createElement("div");
  card.className = "product";
  card.innerHTML = `
    <img src="${imgURL}" alt="${p.name}" onerror="this.src='${PLACEHOLDER_IMG}'" />
    <h3>${p.name}</h3>
    <p>$${priceNum.toFixed(2)}</p>
    <button class="btn add-btn">Add to Cart</button>
  `;
  card.querySelector(".add-btn").addEventListener("click", ()=>{
    CART.push({ id:p.id, name:p.name, price:priceNum });
    cartCountEl.textContent = String(CART.length);
    renderCart();
  });
  productList.appendChild(card);
}

async function loadProducts() {
  productList.innerHTML = "";
  const snap = await db.collection("products").orderBy("name").get();
  if (snap.empty) {
    // fallback: show placeholders if no docs
    for (let i=1;i<=12;i++){
      await addCard({ id:`ph-${i}`, name:`Product ${i}`, price:9.99, image:null });
    }
    return;
  }
  for (const doc of snap.docs) {
    const p = { id: doc.id, ...doc.data() };
    await addCard(p);
  }
}

loadProducts().catch(console.error);

// ---------- SCANDIT — FRONT-SIDE ID CAPTURE (Option B) ----------
const scannerOverlay = $("#scanner-overlay");
const viewContainer = $("#data-capture-view");
const scanStatus = $("#scan-status");
$("#close-scan").addEventListener("click", closeScanner);

let context, view, camera, idCapture;

async function openScanner() {
  scannerOverlay.style.display = "grid";
  scanStatus.textContent = "Loading Scandit…";
  try {
    // Show progress as the WASM downloads (first run can take a few seconds)
    loadingStatus.subscribe((info) => {
      if (info && typeof info.percentage === "number") {
        scanStatus.textContent = `Loading… ${Math.round(info.percentage)}%`;
      }
    });

    await configure({
      licenseKey: `{{SCANDIT_LICENSE}}`,
      // Point to CDN “sdc-lib” for matching version (7.6.1)
      libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-id@7.6.1/sdc-lib/",
      moduleLoaders: [idCaptureLoader({ enableVIZDocuments: true })]
    });

    context = await DataCaptureContext.create();
    view = new DataCaptureView();
    await view.setContext(context);
    await view.connectToElement(viewContainer);

    // Camera
    camera = Camera.default;
    await context.setFrameSource(camera);

    // Only front-side “VIZ” (Visual Inspection Zone) capture
    const settings = new IdCaptureSettings();
    settings.supportedDocuments = new Set([IdDocumentType.IdCardVIZ, IdDocumentType.DrivingLicenseVIZ, IdDocumentType.PassportMRZ]);
    idCapture = await IdCapture.forContext(context, settings);

    // Overlay UI
    IdCaptureOverlay.withIdCaptureForView(idCapture, view);

    // When any ID is captured successfully → mark verified and close
    idCapture.addListener({
      didCaptureId: async () => {
        ID_VERIFIED = true;
        updateCheckoutState();
        scanStatus.textContent = "✅ ID captured";
        setTimeout(closeScanner, 600);
      }
    });

    scanStatus.textContent = "Point your camera at the front of the ID";
    await camera.switchToDesiredState(Camera.State.On);
  } catch (err) {
    console.error(err);
    alert("Camera/Scanner error. Please allow camera permission and try again.");
    closeScanner();
  }
}

async function closeScanner() {
  try {
    if (camera) await camera.switchToDesiredState(Camera.State.Off);
    if (idCapture) { await idCapture.isEnabled = false; }
  } catch {}
  scannerOverlay.style.display = "none";
}

// Open scanner when user taps the button
scanIdBtn.addEventListener("click", () => {
  if (ID_VERIFIED) return;
  openScanner();
});

// ---------- CHECKOUT (placeholder) ----------
checkoutBtn.addEventListener("click", () => {
  if (!CART.length) return alert("Your cart is empty.");
  if (!ID_VERIFIED) return alert("Please scan your ID first.");
  // TODO: integrate your Square link/EmailJS here (unchanged from your flow)
  alert("Proceeding to checkout…");
});

// ---------- CART TOGGLE ----------
$("#cart-btn").addEventListener("click", () => {
  document.querySelector("#cart").scrollIntoView({ behavior: "smooth" });
});
