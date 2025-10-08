<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LBizzo Vape Shop</title>
  <link rel="stylesheet" href="style.css" />
  <script defer src="firebase.js"></script>
  <script defer src="script.js"></script>
</head>
<body>
  <!-- AGE VERIFICATION -->
  <div id="age-check">
    <div class="age-box">
      <h2>Are you 21 or older?</h2>
      <button id="yesBtn">Yes</button>
      <button id="noBtn">No</button>
    </div>
  </div>

  <!-- HEADER -->
  <header>
    <h1>LBizzo Vape Shop</h1>
    <button id="cart-btn">🛒 Cart (<span id="cart-count">0</span>)</button>
  </header>

  <!-- PRODUCTS -->
  <main id="product-list" class="product-grid"></main>

  <!-- CART SECTION -->
  <section id="cart" class="cart hidden">
    <h2>Your Cart</h2>
    <ul id="cart-items"></ul>
    <button id="checkout-btn">Checkout</button>
  </section>
</body>
</html>
