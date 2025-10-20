// netlify/functions/createCheckout.js
// Creates a Square Payment Link dynamically from your cart (names, qty, prices)

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { items, note, customer } = JSON.parse(event.body || "{}");

    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No items received" })
      };
    }

    // ENV (set these in Netlify)
    const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
    const LOCATION_ID  = process.env.SQUARE_LOCATION_ID;

    if (!ACCESS_TOKEN || !LOCATION_ID) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing Square env vars" })
      };
    }

    // Normalize items: { name, qty, price } → Square order line_items
    // Square wants cents as an integer (e.g., 12.99 → 1299).
    const line_items = items.map((i) => {
      const qty   = Number(i.qty || 1);
      const price = Number(i.price || 0);

      if (!i.name || !Number.isFinite(price) || !Number.isFinite(qty) || qty < 1) {
        throw new Error("Invalid item structure");
      }

      return {
        name: String(i.name),
        quantity: String(qty),
        base_price_money: {
          amount: Math.round(price * 100), // dollars → cents
          currency: "USD"
        }
      };
    });

    // Build the order payload
    const order = {
      location_id: LOCATION_ID,
      line_items,
      // Optional: add a note that will show in Square dashboard
      // (e.g., include your cart id, Firebase uid, etc.)
      ...(note ? { note: String(note) } : {})
    };

    // Build the payment link request
    const payload = {
      idempotency_key: cryptoRandom(), // prevents accidental duplicates
      quick_pay: {
        name: "LBizzo Order",
        price_money: {
          // Square requires price_money OR order. We use "order" for multi-line items,
          // but quick_pay also needs a price; Square will override with order total.
          // To be safe, compute a subtotal for quick_pay:
          amount: line_items.reduce((sum, li) => {
            const cents = Number(li.base_price_money?.amount || 0);
            const qty   = Number(li.quantity || "1");
            return sum + (cents * qty);
          }, 0),
          currency: "USD"
        },
        location_id: LOCATION_ID
      },
      order
    };

    // Optional: pre-populate buyer contact on the hosted checkout page
    if (customer && (customer.email || customer.name || customer.phone)) {
      payload.pre_populated_data = {
        buyer_email: customer.email || undefined,
        buyer_phone_number: customer.phone || undefined,
        buyer_address: undefined,
        buyer_name: customer.name || undefined
      };
    }

    // Call Square Payment Links API
    const resp = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-08-15" // or any recent stable version
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Square Error:", data);
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: data })
      };
    }

    const checkoutUrl = data?.payment_link?.url;
    if (!checkoutUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No checkout URL returned" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ url: checkoutUrl })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" })
    };
  }
}

// Minimal crypto-safe idempotency key
function cryptoRandom() {
  // Netlify Node runtime supports Web Crypto
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
