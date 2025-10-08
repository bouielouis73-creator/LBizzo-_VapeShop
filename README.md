# LBizzo Vape Shop & Admin Dashboard

Welcome to **LBizzo Vape Delivery**, a simple and fast vape shop web app for customers and admins.  
Built with **HTML, CSS, JavaScript, and Firebase**, fully deployable on **Netlify** with SMS order alerts powered by **Twilio**.

---

## 🛍️ Customer Side (Main Shop)
**File:** `index.html`

### Features
- ✅ 21+ age verification screen  
- 🛒 Product list loaded live from Firebase Firestore  
- ➕ Add to cart, view totals, remove items  
- 📱 Checkout triggers a Twilio SMS confirmation  
- ⚡ Offline ready with a Service Worker  
- 📦 Progressive Web App (PWA) with install support

---

## 🧑‍💼 Admin Dashboard
**File:** `admin.html`

### Features
- ➕ Add new products with image upload  
- ☁️ Product images saved to Firebase Storage  
- 🗂 Product data stored in Firestore  
- 🔄 Instantly syncs with the customer shop  
- 🧾 Simple and clean admin form interface  

---

## ⚙️ Tech Stack
| Area | Tool |
|------|------|
| Frontend | HTML, CSS, JavaScript |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Notifications | Twilio (via Netlify Function) |
| Hosting | Netlify |
| PWA | Manifest + Service Worker |

---

## 📁 File Structure ---

## 🚀 Deployment (Netlify)
1. Connect this GitHub repo to **Netlify**.  
2. In Netlify → **Site Settings → Environment Variables**, add:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`
3. Build settings: 4. Click **Deploy Site**.  
5. Visit `/admin.html` to add and manage products.  

---

## 💡 Extra Notes
- Firebase must have a **“products”** collection created in Firestore.  
- Twilio credentials must be valid for SMS to send.  
- Works great on both mobile and desktop.  
- Any time you update files on GitHub, Netlify will auto-deploy the new version.  

---

### 🧾 About
**LBizzo Vape Delivery**  
Serving Northampton, Lehigh, and Carbon County — fast, local vape delivery.  
© 2025 LBizzo. All rights reserved.
