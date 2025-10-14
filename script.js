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
