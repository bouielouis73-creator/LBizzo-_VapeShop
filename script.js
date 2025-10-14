async function startIDScan() {
  try {
    // Show scanner area
    scanSection.classList.remove("hidden");
    msg.textContent = "Opening camera...";

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = stream;
    window._scannerStream = stream;

    // Wait for video to initialize
    await new Promise(r => setTimeout(r, 2500));

    // Capture image
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoEl, 0, 0);
    const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg"));

    msg.textContent = "Verifying ID... (please wait)";

    // 🧠 TEMP FIX: skip real verification for now
    // Comment this section back in later when your Netlify function is working
    /*
    const res = await fetch("/.netlify/functions/verify-id", {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: blob
    });
    const data = await res.json();
    const verified = data.verified === true;
    */

    // 🚧 Temporary bypass until Netlify function is working
    const verified = true;

    // Stop the camera
    if (window._scannerStream) {
      window._scannerStream.getTracks().forEach(t => t.stop());
    }
    scanSection.classList.add("hidden");

    if (verified) {
      alert("✅ ID verified! Proceeding to checkout...");
      proceedCheckout();
    } else {
      alert("❌ Sorry, you must be 21+.");
    }

  } catch (err) {
    console.error("Camera or verification error:", err);
    alert("⚠️ Could not verify ID. Please allow camera access and try again.");
    if (window._scannerStream) {
      window._scannerStream.getTracks().forEach(t => t.stop());
    }
    scanSection.classList.add("hidden");
  }
}
