// assets/js/shop.js

function renderShop(list){
  const grid = qs('#productGrid');
  if(!grid) return;
  if(list.length===0){
    grid.innerHTML = `<div class="col-12"><div class="alert alert-info">No notes found. Try different filters.</div></div>`;
    return;
  }
  grid.innerHTML = list.map(p=>`
    <div class="col-sm-6 col-lg-4">
      <div class="card note-card h-100">
        <img class="note-thumb" src="assets/images/note-cover.svg" alt="Note" />
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="mb-1">${p.title}</h5>
            <span class="badge text-bg-warning">${p.badge || p.exam}</span>
          </div>
          <div class="text-muted small mb-2">${p.exam} • ${p.category}</div>
          <p class="text-muted">${p.short}</p>
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div class="price">${formatINR(p.price)}</div>
            <a class="btn btn-primary btn-sm" href="product.html?id=${p.id}">View</a>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function applyFilters(){
  const exam = qs('#filterExam')?.value || 'ALL';
  const maxPrice = parseInt(qs('#filterPrice')?.value || '99999', 10);
  const query = (qs('#searchInput')?.value || '').trim().toLowerCase();

  let list = (window.LC_PRODUCTS||[]).slice();
  if(exam !== 'ALL') list = list.filter(p => p.exam === exam || p.category === exam);
  list = list.filter(p => p.price <= maxPrice);
  if(query) list = list.filter(p => (p.title+p.short).toLowerCase().includes(query));

  renderShop(list);
  qs('#resultCount').textContent = `${list.length} item(s)`;
}

document.addEventListener('DOMContentLoaded', ()=>{
  qsa('#filterExam, #filterPrice').forEach(el => el.addEventListener('change', applyFilters));
  qs('#searchInput')?.addEventListener('input', ()=>{ clearTimeout(window.__t); window.__t=setTimeout(applyFilters,150); });
  qs('#btnReset')?.addEventListener('click', ()=>{ qs('#filterExam').value='ALL'; qs('#filterPrice').value='99999'; qs('#searchInput').value=''; applyFilters(); });
  applyFilters();
});
