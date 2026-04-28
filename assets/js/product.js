// assets/js/product.js

document.addEventListener('DOMContentLoaded', ()=>{
  const id = parseInt(getQueryParam('id') || '1', 10);
  const p = (window.LC_PRODUCTS||[]).find(x=>x.id===id);
  const root = qs('#productRoot');
  if(!p){ root.innerHTML = `<div class="alert alert-danger">Product not found.</div>`; return; }

  qs('#pTitle').textContent = p.title;
  qs('#pMeta').textContent = `${p.exam} • ${p.category}`;
  qs('#pPrice').textContent = formatINR(p.price);
  qs('#pShort').textContent = p.short;
  qs('#pDesc').textContent = p.description;
  qs('#pPages').textContent = `${p.pages} pages`;
  qs('#pChaptersCount').textContent = `${p.chapters.length} chapters`;
  qs('#chapterList').innerHTML = p.chapters.map(c=>`<li class="list-group-item">${c}</li>`).join('');

  qs('#btnAddToCart').addEventListener('click', ()=>{
    addToCart(p.id,1);
    const toastEl = qs('#addedToast');
    if(toastEl) bootstrap.Toast.getOrCreateInstance(toastEl).show();
  });

  qs('#btnBuyNow').addEventListener('click', ()=>{ addToCart(p.id,1); window.location.href='checkout.html'; });
});
