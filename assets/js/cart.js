// assets/js/cart.js

function addToCart(productId, qty=1){
  const cart = getCart();
  const idx = cart.findIndex(x=>x.id===productId);
  if(idx>=0) cart[idx].qty += qty;
  else cart.push({id:productId, qty});
  setCart(cart);
}

function removeFromCart(productId){
  setCart(getCart().filter(x=>x.id!==productId));
}

function updateQty(productId, qty){
  qty = Math.max(1, parseInt(qty||'1',10));
  const cart = getCart();
  const it = cart.find(x=>x.id===productId);
  if(it){ it.qty = qty; setCart(cart); }
}

function cartItemsDetailed(){
  const byId = new Map((window.LC_PRODUCTS||[]).map(p=>[p.id,p]));
  return getCart().map(it=>({ ...it, product: byId.get(it.id) })).filter(x=>x.product);
}

function cartTotals(){
  const items = cartItemsDetailed();
  const subtotal = items.reduce((s,it)=>s + it.product.price*it.qty, 0);
  const discount = subtotal >= 499 ? Math.round(subtotal*0.05) : 0;
  const platformFee = subtotal>0 ? 0 : 0;
  const total = Math.max(0, subtotal - discount + platformFee);
  return {subtotal, discount, platformFee, total};
}
