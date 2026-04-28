// assets/js/admin.js
// UI only: product create + order view (localStorage)

document.addEventListener('DOMContentLoaded', ()=>{
  const addForm = qs('#adminAddProductForm');
  const ordersBody = qs('#adminOrdersBody');
  const msg = qs('#adminMsg');

  function renderOrders(){
    const orders = JSON.parse(localStorage.getItem('lc_orders') || '[]');
    if(orders.length===0){
      ordersBody.innerHTML = `<tr><td colspan="5" class="text-muted">No orders available (simulate a checkout first).</td></tr>`;
      return;
    }
    ordersBody.innerHTML = orders.map(o=>{
      const dt = new Date(o.createdAt);
      return `
        <tr>
          <td>${o.id}</td>
          <td>${o.name || '-'}</td>
          <td>${o.email || '-'}</td>
          <td>${formatINR(o.total)}</td>
          <td>${dt.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  }

  addForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    // UI-only: pushes to in-memory dataset (refresh resets)
    const title = qs('#adminTitle').value.trim();
    const exam = qs('#adminExam').value;
    const price = parseInt(qs('#adminPrice').value||'0',10);
    if(!title || !price){
      msg.innerHTML = `<div class="alert alert-warning">Please enter title and price.</div>`;
      return;
    }

    const maxId = Math.max(...(window.LC_PRODUCTS||[]).map(p=>p.id), 0);
    window.LC_PRODUCTS.push({
      id: maxId+1,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
      title,
      exam,
      category: exam,
      price,
      short: 'Newly added product (UI only).',
      description: 'Replace this description from backend.',
      pages: 100,
      chapters: ['Chapter 1','Chapter 2'],
      badge: 'Draft'
    });

    msg.innerHTML = `<div class="alert alert-success">Product added (UI-only). Integrate backend: POST /products + upload PDF.</div>`;
    addForm.reset();
  });

  renderOrders();
});
