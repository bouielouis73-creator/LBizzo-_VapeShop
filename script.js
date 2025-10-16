/* ==============================
   ✅ LBizzo Vape Shop Styles
   Black + Orange Theme
   ============================== */

/* ---------- Base Layout ---------- */
:root {
  --orange: #ff8c00;
  --bg: #000;
  --card: #141414;
  --text: #eaeaea;
  --muted: #999;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Arial', sans-serif;
  overflow-x: hidden;
}

/* ---------- Header ---------- */
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #111;
  border-bottom: 2px solid var(--orange);
}

header h1 {
  font-size: 1.6rem;
  color: #fff;
  font-weight: 700;
}

#cart-btn {
  background: var(--orange);
  color: #000;
  border: none;
  border-radius: 40px;
  padding: 8px 20px;
  font-weight: bold;
  cursor: pointer;
  position: relative;
  transition: background 0.3s ease;
}

#cart-btn:hover {
  background: #ffa733;
}

#cart-count {
  background: #000;
  color: var(--orange);
  border-radius: 50%;
  padding: 3px 8px;
  font-size: 0.9em;
  font-weight: 700;
  margin-left: 6px;
}

/* ---------- Age Verification Overlay ---------- */
.overlay {
  position: fixed;
  inset: 0;
  display: none;
  place-items: center;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
}

.modal {
  background: #111;
  border: 2px solid var(--orange);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  color: #fff;
}

.modal h2 {
  margin-top: 0;
  color: var(--orange);
}

.btns button {
  background: var(--orange);
  border: none;
  color: #000;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: bold;
  margin: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btns button:hover {
  background: #ffa733;
}

/* ---------- Loyalty Stars ---------- */
#loyalty {
  text-align: center;
  margin: 15px 0;
}

#stars {
  display: flex;
  justify-content: center;
  gap: 4px;
  font-size: 1.8rem;
  color: #555;
}

#stars .active {
  color: var(--orange);
}

#loyalty p {
  color: var(--muted);
  margin-top: 4px;
}

/* ---------- Product Grid ---------- */
.product-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px;
}

/* ---------- Product Card ---------- */
.product {
  background: var(--card);
  border: 2px solid var(--orange);
  border-radius: 14px;
  padding: 12px;
  text-align: center;
  color: var(--text);
  box-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
  width: 280px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 16px rgba(255, 140, 0, 0.6);
}

/* ✅ Fixed Image Size + Rounded Edges */
.product img {
  width: 100%;
  max-width: 240px;
  height: 220px;
  object-fit: cover;
  border-radius: 10px;
  display: block;
  margin: 0 auto 10px;
  background: #000;
}

/* Product Titles + Prices */
.product h3 {
  font-size: 1.1rem;
  margin: 8px 0 4px;
  color: #fff;
}

.product p {
  color: var(--orange);
  margin: 4px 0 10px;
  font-weight: bold;
}

/* Buttons */
.product button {
  background: var(--orange);
  color: #000;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.product button:hover {
  background: #ffa733;
}

/* ---------- Cart Modal ---------- */
#cart {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 400px;
  height: 100%;
  background: #111;
  color: #fff;
  border-left: 2px solid var(--orange);
  box-shadow: -2px 0 10px rgba(255, 140, 0, 0.3);
  padding: 20px;
  z-index: 9998;
  display: none;
  flex-direction: column;
}

#cart h2 {
  margin-top: 0;
  color: var(--orange);
  text-align: center;
}

#cart-items {
  list-style: none;
  padding: 0;
  margin: 10px 0;
  overflow-y: auto;
  flex-grow: 1;
}

#cart-items li {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 10px;
}

#cart-items img {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #333;
}

#cart .qty button {
  background: var(--orange);
  border: none;
  color: #000;
  border-radius: 6px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-weight: bold;
}

#cart .qty span {
  margin: 0 6px;
}

.cart-total {
  text-align: right;
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--orange);
}

/* Checkout Form */
.checkout-form input {
  width: 100%;
  padding: 10px;
  margin: 6px 0;
  border-radius: 8px;
  border: 1px solid #333;
  background: #0b0b0b;
  color: #fff;
}

.cart-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.cart-actions button {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}

#scan-id-btn {
  background: #111;
  border: 2px solid var(--orange);
  color: var(--orange);
}

#scan-id-btn:hover {
  background: var(--orange);
  color: #000;
}

#checkout-btn {
  background: #444;
  color: #aaa;
}

#checkout-btn.enabled {
  background: var(--orange);
  color: #000;
}

#close-cart {
  background: #111;
  border: 2px solid #444;
  color: #fff;
}

#close-cart:hover {
  background: #333;
}
