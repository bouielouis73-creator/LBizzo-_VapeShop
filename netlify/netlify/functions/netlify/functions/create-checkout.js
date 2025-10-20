// ✅ netlify/functions/create-checkout.js
import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { items } = JSON.parse(event.body || "{}");
    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "No items received" }) };
    }

    const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
    const LOCATION_ID = process.env.SQUARE_LOCATION_ID;

    // 🧾 Build order data
    const body = {
      idempotency_key: Date.now().toString(),
      order: {
        location_id: LOCATION_ID,
        line_items: items.map(i => ({
          name: i.name || "Unnamed Item",
          quantity: String(i.qty || 1),
          base_price_money: {
            amount: Math.round(Number(i.price) * 100), // Convert dollars → cents
            currency: "USD"
          }
        }))
      },
      redirect_url: "https://lbizzo.netlify.app/success.html"
    };

    // 🪄 Call Square API
    const response = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!data.payment_link?.url) {
      console.error("Square error:", data);
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to create payment link" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: data.payment_link.url })
    };
  } catch (err) {
    console.error("Checkout function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
