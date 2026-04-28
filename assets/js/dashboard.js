// assets/js/dashboard.js

document.addEventListener('DOMContentLoaded', ()=>{
  const user = JSON.parse(localStorage.getItem('lc_user') || 'null');
  qs('#userEmail').textContent = user?.email || 'guest@learnchemistry.in';

  const orders = JSON.parse(localStorage.getItem('lc_orders') || '[]');
  if(getQueryParam('paid')==='1'){
    qs('#dashMsg').innerHTML = `<div class="alert alert-success">Payment successful (simulated). Your notes are ready.</div>`;
  }

  const purchased = new Map();
  orders.forEach(o=>{
    (o.items||[]).forEach(it=>purchased.set(it.id, it));
  });

  const byId = new Map((window.LC_PRODUCTS||[]).map(p=>[p.id,p]));
  const notes = Array.from(purchased.keys()).map(id=>byId.get(id)).filter(Boolean);

  const notesRoot = qs('#myNotes');
  if(notes.length===0){
    notesRoot.innerHTML = `<div class="alert alert-info">No purchases yet. <a href="shop.html">Browse notes</a>.</div>`;
  }else{
    notesRoot.innerHTML = notes.map(p=>`
      <div class="card note-card mb-3">
        <div class="card-body d-flex flex-column flex-md-row gap-3 align-items-md-center">
          <img src="assets/images/note-cover.svg" class="rounded" style="width:92px;height:92px;object-fit:cover" alt="cover" />
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between gap-2">
              <div>
                <h5 class="mb-1">${p.title}</h5>
                <div class="text-muted small">${p.exam} • ${p.category}</div>
              </div>
              <span class="badge text-bg-success align-self-start">Purchased</span>
            </div>
            <div class="text-muted small">Download link will map to: GET /download/${p.id}</div>
          </div>
          <button class="btn btn-success" data-download="${p.id}"><i class="bi bi-download"></i> Download</button>
        </div>
      </div>
    `).join('');

    qsa('[data-download]').forEach(btn=>btn.addEventListener('click', ()=>{
      const id = btn.dataset.download;
      // UI-only placeholder
      alert(`Download simulated. Backend should call: GET /download/${id}`);
    }));
  }

  // Orders table
  const tableRoot = qs('#orderTableBody');
  if(orders.length===0){
    tableRoot.innerHTML = `<tr><td colspan="5" class="text-muted">No orders found.</td></tr>`;
  }else{
    tableRoot.innerHTML = orders.map(o=>{
      const dt = new Date(o.createdAt);
      const items = (o.items||[]).map(x=>x.title).join(', ');
      return `
        <tr>
          <td>${o.id}</td>
          <td>${dt.toLocaleString()}</td>
          <td class="text-truncate" style="max-width:360px;">${items}</td>
          <td>${formatINR(o.total)}</td>
          <td><span class="badge text-bg-success">${o.status}</span></td>
        </tr>
      `;
    }).join('');
  }
});
