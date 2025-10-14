// ---------- ID SCANNER ----------
async function startIDScan() {
  const scanSection = document.getElementById("id-scan-section");
  const msg = document.getElementById("id-message");
  scanSection.classList.remove("hidden");
  msg.textContent = "Loading camera…";

  try {
    await ScanditSDK.configure("YOUR_SCANDIT_LICENSE_KEY", {
      engineLocation: "https://cdn.jsdelivr.net/npm/scandit-sdk@5.x/build/",
    });

    const barcodePicker = await ScanditSDK.BarcodePicker.create(
      document.getElementById("id-video"),
      { playSoundOnScan: true, vibrateOnScan: true }
    );

    const scanSettings = new ScanditSDK.ScanSettings({
      enabledSymbologies: ["pdf417"], // Driver’s license barcode
      codeDuplicateFilter: 1000,
    });

    barcodePicker.applyScanSettings(scanSettings);

    barcodePicker.onScan((scanResult) => {
      const code = scanResult.barcodes[0]?.data || "";
      if (code.includes("DBB")) {
        const dobMatch = code.match(/DBB(\d{8})/);
        if (dobMatch) {
          const year = parseInt(dobMatch[1].substring(0, 4), 10);
          const age = new Date().getFullYear() - year;
          if (year >= 2004 || age < 21) {
            alert("❌ Sorry, we can’t sell you tobacco products. You must be 21+.");
            document.getElementById("checkout-btn").disabled = true;
            document.getElementById("checkout-btn").style.opacity = "0.5";
            msg.textContent = "Access denied — under 21.";
          } else {
            alert("✅ ID verified! You are 21+.");
            document.getElementById("checkout-btn").disabled = false;
            document.getElementById("checkout-btn").style.opacity = "1";
            msg.textContent = "Verified ✅";
            scanSection.classList.add("hidden");
          }
        }
      }
    });
  } catch (err) {
    console.error(err);
    msg.textContent = "Camera or scanner error.";
  }
}

document.getElementById("close-scan").addEventListener("click", () => {
  document.getElementById("id-scan-section").classList.add("hidden");
});

// ✅ Attach scanner to checkout button
document.getElementById("checkout-btn").addEventListener("click", (e) => {
  e.preventDefault();
  startIDScan();
});
/* ✅ Responsive Product Grid Fix */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 15px;
  padding: 15px;
}

.product {
  background: var(--card, #141414);
  color: var(--text, #fff);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(255,140,0,0.3);
}

.product img {
  width: 100%;
  max-width: 130px;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
  margin-bottom: 6px;
}

.product h3 {
  font-size: 0.9rem;
  color: var(--orange, #ff8c00);
  margin: 4px 0;
}

.product p {
  font-size: 0.85rem;
  color: #fff;
  margin: 2px 0 8px;
}

/* ✅ Buttons inside product cards */
.product button {
  font-size: 0.8rem;
  padding: 8px 10px;
  width: 90%;
  margin: 0 auto;
  background: var(--orange, #ff8c00);
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.product button:hover {
  background: #ffa733;
}

/* ✅ Mobile-friendly adjustments */
@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  }
  .product img {
    max-width: 110px;
  }
  .product h3 {
    font-size: 0.8rem;
  }
  .product p {
    font-size: 0.75rem;
  }
}
