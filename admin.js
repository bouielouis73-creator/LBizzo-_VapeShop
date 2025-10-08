const form = document.getElementById("addProductForm");
const list = document.getElementById("product-list");

form.addEventListener("submit", async e => {
  e.preventDefault();
  const name = form.name.value;
  const price = parseFloat(form.price.value);
  const file = form.image.files[0];

  const ref = storage.ref("products/" + file.name);
  await ref.put(file);
  const imageURL = await ref.getDownloadURL();

  await db.collection("products").add({ name, price, image: imageURL });
  form.reset();
});

// Display products for admin
db.collection("products").onSnapshot(snapshot => {
  list.innerHTML = "";
  snapshot.forEach(doc => {
    const p = doc.data();
    list.innerHTML += `
      <div class="product">
        <img src="${p.image}" width="100">
        <h3>${p.name}</h3>
        <p>$${p.price}</p>
      </div>`;
  });
});
