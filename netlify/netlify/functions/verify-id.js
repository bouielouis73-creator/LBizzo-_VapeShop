// netlify/functions/verify-id.js
// ✅ Simple example of verifying uploaded ID photo or data
// (Uses built-in fetch — no "node-fetch" required)

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" })
      };
    }

    // Parse JSON body from your app
    const { imageUrl, userId } = JSON.parse(event.body || "{}");

    if (!imageUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing ID image URL" })
      };
    }

    // ✅ Example call — you can replace with your own ID check or AI API
    // For now, just pretend it verified successfully.
    // If you later add real verification, use `await fetch(...)` here.

    const verified = true; // Simulated result

    if (verified) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "ID verified successfully",
          userId
        })
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "ID failed verification" })
      };
    }
  } catch (err) {
    console.error("verify-id error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" })
    };
  }
}
