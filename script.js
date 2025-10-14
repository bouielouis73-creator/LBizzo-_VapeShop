import {
  DataCaptureContext, Camera, configure, DataCaptureView, loadingStatus
} from "@scandit/web-datacapture-core";
import {
  IdCapture, IdCaptureOverlay, IdDocumentType, IdCaptureSettings, idCaptureLoader
} from "@scandit/web-datacapture-id";

const PLACEHOLDER_IMG = "https://via.placeholder.com/300x200?text=LBizzo";
const db = window.db;
const storage = window.storage;

// ---------- AGE VERIFICATION ----------
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("age-check");
  const yes = document.getElementById("yesBtn");
  const no  = document.getElementById("noBtn");
  if (overlay && yes && no) {
    overlay.style.display = "grid";
    const allow = e => { e.preventDefault(); overlay.style.display = "none"; };
    const deny  = e => { e.preventDefault(); alert("Sorry, you must be 21+ to enter."); location.href = "https://google.com"; };
    ["click","touchstart"].forEach(evt=>{
      yes.addEventListener(evt, allow, {passive:false});
      no.addEventListener(evt, deny, {passive:false});
    });
  }
});

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

async function getImageURL(path) {
  if (!path) return PLACEHOLDER_IMG;
  if (/^https?:/i.test(path)) return path;
  try {
    const ref = storage.ref(path.startsWith("products/") ? path : `products/${path}`);
    return await ref.getDownloadURL();
  } catch (e) {
    console.warn("Image load failed", e);
    return PLACEHOLDER_IMG;
  }
}

const productList = $("#product-list");
const cartItemsEl = $("#cart-items");
const cartCountEl = $("#cart-count");
const checkoutBtn = $("#checkout-btn");
const scanIdBtn   = $("#scan-id-btn");
let CART = [];
let ID_VERIFIED = false;

function renderCart() {
  cartItemsEl.innerHTML = "";
  CART.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML = `${item.name} - $${item.price.toFixed(2)} <button data-i="${i}" class="btn" style="background:#333;color:#fff">Remove</button>`;
    li.querySelector("button").onclick = e => { CART.splice(i,1); cartCountEl.textContent=CART.length; renderCart(); };
    cartItemsEl.append(li);
  });
  checkoutBtn.disabled = !(CART.length && ID_VERIFIED);
}

async function addCard(p) {
  const priceNum = Number(p.price) || 0;
  const imgURL = await getImageURL(p.image);
  const div = document.createElement("div");
  div.className = "product";
  div.innerHTML = `
    <img src="${imgURL}" alt="${p.name}" />
    <h3>${p.name}</h3>
    <p>$${priceNum.toFixed(2)}</p>
    <button class="btn">Add to Cart</button>
  `;
  div.querySelector("button").onclick = () => {
    CART.push({name:p.name, price:priceNum});
    cartCountEl.textContent = CART.length;
    renderCart();
  };
  productList.append(div);
}

async function loadProducts() {
  const snap = await db.collection("products").get();
  if (snap.empty) {
    for (let i=1;i<=10;i++) await addCard({name:`Product ${i}`, price:9.99});
    return;
  }
  for (const doc of snap.docs) await addCard({id:doc.id, ...doc.data()});
}
loadProducts();

// ---------- SCANDIT CAMERA ----------
const overlay = $("#scanner-overlay");
const viewBox = $("#data-capture-view");
const status = $("#scan-status");
$("#close-scan").onclick = () => closeScanner();

let ctx, view, cam, capture;

async function openScanner() {
  overlay.style.display = "grid";
  status.textContent = "Starting camera...";
  try {
    loadingStatus.subscribe(info => {
      if (info?.percentage) status.textContent = `Loading SDK… ${Math.round(info.percentage)}%`;
    });

    await configure({
      licenseKey: "AvNGZmIcRW6pNTmJkfbAcrAlYOjPJs8E0z+DWlIBQhyoQjWvpm3HvsF2SLcrUahgnXcHsNR76tZtMwL/IGsuoVQRdDqIfwkKR2PjGvM2kRxWB8bzwQ6hYPRCRXuqaZhAmGC6iSNNr8cgXblA7m1ZNydspwKLV67zY1tMhzlxG1XNd2s4YGuWaOVVfuTyUmKZ3ne7w75hl7b6I1CoYxM61n5mXxqjZaBKTVCkUqpYKH96XGAQS1FS5nBcqvEncKyQ83yRkWAQCNMIe5Pf62NM5MxOk/PMaQRN5mL8Hx1dY0e1eDbtalyTGDRq/3pbdNQ2wHBxXMlLL1ubSkte/FG9MLxf7J9KQC5/jlqBwhtXC8O8amwpv0g1/Txo/v8tVBMqkxkYTEZ7AeUvXC9mb0GYDlt+RdXhQedpeU+YQxcj1zzQa+pYTlx1d5laJHh3WMjL1nKzEUZlZXZpUZbxASRzM48blxXef8EtyyVCnS5X2WyBWRUGEGVfjUIiawJRFrxu31ll5ghjcpeWHsJTdTrYUGgegsdXcz6jeB0jcg6cISpkQ+vfVYZ1Cz33hCdJIpjP6YdV1txoUHPQf/9KJkImFT6XFWj6khyUHtnZjDZyyApE4bWHuMZtDzghqN30nYaX47bZQbrSELMCguYjhVRrUaA4M1IBTHMjtwTlFNFSTups1/pUFPI4mNV8ZuKuRwANY9MO4STHjdCfX6CA/xjsbBbBc+b5N1N8E70TNlAUsov2sgisR7ICqNFXG+H93QFuKd3F6nVvY8DiYOZ+7HvY5KVBkIY2Fys70JRdPyRQeCpRdEmwzReb//77uF344Wt0UZmFXSNBAOEPJdDjRvAllzC7ZRtiGYiSbGlV9yDs6Ly6XF0miq2G3pZtiTCQqdYT2/R7M0ENi4qLYDnLbfFAiux3PI/AmUsOfbWRxnKARt2pWn0vFHIdgeswEMITqF2etKjPbjzy5LDs+YxXfF+D4h//svwIUeMuOAjunsNRs2ZUpzdMGAXzUTF/YEE/upE1tRmFrDAWDKzYpb9ouoKNNPDR9SgrwhcCKk+nXbpOhiWlkZjVmBr0edch/b/2ywfMtImPqq/CWix1RSlYHse85OSKKiXaGRp6FqhBccGh7h2FVOWvgVC75c7vJ+sOvksOxhLI8IR46aAnNDHatQwBjrHeIBBbNBNUKj2u34KXvvSvC6qM7FVWKUt1b5zu2rGc4NI=",
      libraryLocation: "https://cdn.jsdelivr.net/npm/@scandit/web-datacapture-id@7.6.1/sdc-lib/",
      moduleLoaders: [idCaptureLoader({enableVIZDocuments:true})]
    });

    ctx = await DataCaptureContext.create();
    view = new DataCaptureView();
    await view.setContext(ctx);
    await view.connectToElement(viewBox);
    cam = Camera.default;
    await ctx.setFrameSource(cam);

    const settings = new IdCaptureSettings();
    settings.supportedDocuments = new Set([IdDocumentType.IdCardVIZ, IdDocumentType.DrivingLicenseVIZ, IdDocumentType.PassportMRZ]);
    capture = await IdCapture.forContext(ctx, settings);
    IdCaptureOverlay.withIdCaptureForView(capture, view);

    capture.addListener({
      didCaptureId: async () => {
        ID_VERIFIED = true;
        overlay.style.display = "none";
        scanIdBtn.textContent = "✅ ID Verified";
        checkoutBtn.disabled = false;
        await cam.switchToDesiredState(Camera.State.Off);
      }
    });

    status.textContent = "Point your camera at the front of the ID";
    await cam.switchToDesiredState(Camera.State.On);
  } catch (e) {
    alert("Camera failed: " + e.message);
    overlay.style.display = "none";
  }
}

async function closeScanner() {
  if (cam) await cam.switchToDesiredState(Camera.State.Off);
  overlay.style.display = "none";
}

scanIdBtn.onclick = () => openScanner();

checkoutBtn.onclick = () => {
  if (!CART.length) return alert("Your cart is empty.");
  if (!ID_VERIFIED) return alert("Scan your ID first.");
  alert("Proceeding to checkout...");
};
