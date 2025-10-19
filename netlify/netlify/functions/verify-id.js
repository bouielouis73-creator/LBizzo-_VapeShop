import fetch from "node-fetch";
import crypto from "crypto";

export async function handler(event) {
  try {
    const { items } = JSON.parse(event.body || "{}");
    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "No items received" }) };
    }

    // ✅ Square credentials from Netlify Environment Variables
    const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
    const LOCATION_ID = process.env.SQUARE_LOCATION_ID;

    // ✅ Build the order dynamically with real names + prices
    const order = {
      location_id: LOCATION_ID,
      line_items: items.map(i => ({
        name: i.name || "Unnamed Item",
        quantity: String(i.qty || 1),
        base_price_money: {
          amount: Math.round(Number(i.price) * 100), // 🔥 convert to cents
          currency: "USD"
        }
      }))
    };

    const body = {
      idempotency_key: crypto.randomUUID(),
      order,
      checkout_options: {
        redirect_url: "https://lbizzodelivery.netlify.app/thanks.html",
        allow_tipping: true
      }
    };

    const response = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.payment_link?.url) {
      return { statusCode: 200, body: JSON.stringify({ url: data.payment_link.url }) };
    } else {
      console.error("❌ Square API error:", data);
      return { statusCode: 500, body: JSON.stringify(data) };
    }

  } catch (err) {
    console.error("❌ Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
