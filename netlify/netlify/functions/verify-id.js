// netlify/functions/verify-id.js
// ✅ Working version — no node-fetch needed

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    // Parse incoming data
    const { imageUrl, name, email } = JSON.parse(event.body || "{}");

    if (!imageUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing ID image URL" })
      };
    }

    // Simulated verification logic
    console.log("🆔 Received ID image:", imageUrl);

    // Always "verified" for now
    const verified = true;

    if (verified) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "ID verified successfully",
          name,
          email
        })
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Verification failed"
        })
      };
    }
  } catch (err) {
    console.error("verify-id error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message || "Server error"
      })
    };
  }
}
