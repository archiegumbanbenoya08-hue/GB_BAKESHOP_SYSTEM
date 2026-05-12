// main entry point for client-side scripts

// after DOM loaded
window.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    initHamburger();
    initPages();
});

// highlight active navigation link
function setActiveNav() {
    const links = document.querySelectorAll('header nav a, .sidebar ul li a');
    const path = window.location.pathname.split('/').pop();
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === path || (href === 'dashboard.html' && path === '')) {
            link.classList.add('active');
        }
    });
}

// hamburger toggle for sidebar
function initHamburger() {
    const ham = document.getElementById('hamburger');
    if (!ham) return;
    ham.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('show');
        }
    });
    
    // close sidebar when clicking a link
    const links = document.querySelectorAll('.sidebar a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.remove('show');
            }
        });
    });
}

// page-specific initialization
function initPages() {
    if (document.getElementById('productsTable')) {
        loadProducts();
        setupProductModal();
        labelTableCells('#productsTable');
        setupSearch();
    }
    if (document.getElementById('inventoryTable')) {
        loadInventory();
        labelTableCells('#inventoryTable');
    }
    if (document.getElementById('ordersTable')) {
        loadOrders();
        labelTableCells('#ordersTable');
        setupOrderSearch();
        setupOrderModal();
    }
}

// add data-label attributes for small-screen table headers
function labelTableCells(selector) {
    const table = document.querySelector(selector);
    if (!table) return;
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    table.querySelectorAll('tbody tr').forEach(tr => {
        tr.querySelectorAll('td').forEach((td, i) => {
            if (headers[i]) {
                td.setAttribute('data-label', headers[i]);
            }
        });
    });
}

// handle login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const showError = (msg) => {
            let errEl = document.getElementById('loginError');
            if (!errEl) {
                errEl = document.createElement('div');
                errEl.id = 'loginError';
                errEl.style.color = 'var(--danger)';
                errEl.style.marginTop = '10px';
                loginForm.appendChild(errEl);
            }
            errEl.textContent = msg;
        };

        try {
            const data = await request('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            // on success redirect to dashboard (could vary by role)
            window.location.href = '/pages/dashboard.html';
        } catch (err) {
            showError(err.message || 'Login failed.');
            console.error('login error', err);
        }
    });
}

// centralized API requests
async function request(path, options={}) {
    const res = await fetch('/api' + path, options);
    if (!res.ok) throw new Error('API request failed');
    return res.json();
}

// example fetch operations with mock data
async function loadProducts() {
    try {
        const products = await request('/products');
        const tbody = document.querySelector('#productsTable tbody');
        if (!tbody) return products;
        tbody.innerHTML = '';
        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.product_name}</td>
                <td>${p.category}</td>
                <td>${formatCurrency(p.price)}</td>
                <td>${p.stock_quantity}</td>
                <td>
                    <a href="#" class="btn edit-btn" data-id="${p.id}">Edit</a>
                    <a href="#" class="btn danger delete-btn" data-id="${p.id}">Delete</a>
                </td>`;
            tbody.appendChild(tr);
        });
        labelTableCells('#productsTable');
        attachProductActions();
        return products;
    } catch (err) {
        console.error('loadProducts', err);
        return [];
    }
}

// filter products table by search term
function setupSearch() {
    const input = document.getElementById('productSearch');
    if (!input) return;
    input.addEventListener('input', () => {
        const term = input.value.toLowerCase();
        document.querySelectorAll('#productsTable tbody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    });
}

// attach edit/delete handlers after loading products
function attachProductActions() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const id = btn.dataset.id;
            // fetch single product
            const prod = await request(`/products/${id}`);
            if (!prod) return;
            editingProductId = id;
            document.getElementById('pName').value = prod.product_name;
            document.getElementById('pCategory').value = prod.category;
            document.getElementById('pPrice').value = prod.price;
            document.getElementById('pStock').value = prod.stock_quantity;
            document.querySelector('#productModal .modal-header h3').textContent = 'Edit Product';
            document.getElementById('productModal').classList.add('show');
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!confirm('Are you sure you want to delete this product?')) return;
            const id = btn.dataset.id;
            try {
                await request(`/products/${id}`, { method: 'DELETE' });
                loadProducts();
            } catch (err) {
                console.error('delete product', err);
            }
        });
    });
}

async function loadInventory() {
    try {
        const items = await request('/inventory');
        const tbody = document.querySelector('#inventoryTable tbody');
        if (!tbody) return items;
        tbody.innerHTML = '';
        items.forEach(i => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i.product_name}</td>
                <td>${i.stock_quantity}</td>
                <td>${i.last_transaction ? new Date(i.last_transaction).toLocaleString() : '-'}</td>`;
            tbody.appendChild(tr);
        });
        labelTableCells('#inventoryTable');
        return items;
    } catch (err) {
        console.error('loadInventory', err);
        return [];
    }
}

async function loadOrders() {
    try {
        const orders = await request('/orders');
        const tbody = document.querySelector('#ordersTable tbody');
        if (!tbody) return orders;
        tbody.innerHTML = '';
        orders.forEach(o => {
            const tr = document.createElement('tr');
            // make sure status string exists and lowercase for class
            const statusText = (o.status || 'pending').toString();
            const statusClass = statusText.toLowerCase();
            tr.dataset.id = o.id; // store order id for detail lookup
            // show order number/name before the date for clarity
            const dateDisplay = `Order #${o.id} - ${new Date(o.order_date).toLocaleString()}`;
            tr.innerHTML = `
                <td>${dateDisplay}</td>
                <td>${o.staff || 'Unknown'}</td>
                <td>${formatCurrency(o.total_amount)}</td>
                <td><span class="status-${statusClass}">${statusText.charAt(0).toUpperCase() + statusText.slice(1)}</span></td>
                <td><a href="#" class="btn view-btn">View</a></td>`;
            tbody.appendChild(tr);
        });
        labelTableCells('#ordersTable');
        attachOrderViewActions();
        return orders;
    } catch (err) {
        console.error('loadOrders', err);
        return [];
    }
}

function setupOrderSearch() {
    const input = document.getElementById('orderSearch');
    if (!input) return;
    input.addEventListener('input', () => {
        const term = input.value.toLowerCase();
        document.querySelectorAll('#ordersTable tbody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    });
}

// product modal logic
let editingProductId = null;

// attach view button behavior for orders
async function attachOrderViewActions() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const tr = btn.closest('tr');
            if (!tr) return;
            const orderId = tr.dataset.id;
            if (!orderId) return;
            try {
                const order = await request(`/orders/${orderId}`);
                if (!order) {
                    showAlert('Order not found', 'warning');
                    return;
                }
                showOrderDetails(order);
            } catch (err) {
                console.error('fetch order detail', err);
                showAlert('Failed to load order details', 'error');
            }
        });
    });
}

// display order in detail modal
function showOrderDetails(order) {
    const body = document.getElementById('orderDetailBody');
    if (!body) return;
    let html = `<p><strong>Order #${order.id}</strong></p>`;
    html += `<p>Date: ${new Date(order.order_date).toLocaleString()}</p>`;
    html += `<p>Staff: ${order.staff || 'Unknown'}</p>`;
    html += `<p>Status: ${order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}</p>`;
    html += `<p>Total: ${formatCurrency(order.total_amount)}</p>`;
    if (Array.isArray(order.items) && order.items.length) {
        html += `<h4>Items</h4><table style="width:100%;border-collapse:collapse;"><thead><tr><th style="text-align:left;">Product</th><th>Qty</th><th>Subtotal</th></tr></thead><tbody>`;
        order.items.forEach(i => {
            html += `<tr><td>${i.product_name}</td><td style="text-align:center;">${i.quantity}</td><td style="text-align:right;">${formatCurrency(i.subtotal)}</td></tr>`;
        });
        html += '</tbody></table>';
    } else {
        html += '<p><em>No items.</em></p>';
    }
    body.innerHTML = html;
    const modal = document.getElementById('orderDetailModal');
    if (modal) modal.classList.add('show');
}

// close behaviour for detail modal
function initOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    const close = document.getElementById('orderDetailClose');
    if (close) close.addEventListener('click', () => modal && modal.classList.remove('show'));
    if (modal) modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('show');
    });
}

// call initialization early in script
initOrderDetailModal();

function setupProductModal() {
    const modal = document.getElementById('productModal');
    const addBtn = document.getElementById('addProductBtn');
    const closeBtn = document.getElementById('modalClose');
    const form = document.getElementById('productForm');

    addBtn && addBtn.addEventListener('click', () => {
        editingProductId = null;
        document.querySelector('#productModal .modal-header h3').textContent = 'Add Product';
        form.reset();
        modal.classList.add('show');
    });
    closeBtn && closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    modal && modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });
    form && form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            product_name: document.getElementById('pName').value.trim(),
            category: document.getElementById('pCategory').value.trim(),
            price: parseFloat(document.getElementById('pPrice').value),
            stock_quantity: parseInt(document.getElementById('pStock').value, 10)
        };
        try {
            if (editingProductId) {
                await request(`/products/${editingProductId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            } else {
                await request('/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            }
            modal.classList.remove('show');
            loadProducts();
        } catch (err) {
            console.error('save product', err);
            alert('Error saving product');
        }
    });
}

// order creation modal (called from orders.html)
let orderItems = [];

async function setupOrderModal() {
    const modal = document.getElementById('orderModal');
    if (!modal) return;
    
    const addBtn = document.getElementById('addOrderBtn');
    const closeBtn = document.getElementById('orderModalClose');
    const form = document.getElementById('orderForm');
    const productList = document.getElementById('productList');
    const staffSelect = document.getElementById('staffSelect');

    // load products for selection
    async function loadProductsForOrder() {
        try {
            const products = await request('/products');
            productList.innerHTML = products.map(p => `
                <div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; display: flex; justify-content: space-between; align-items: center; hover:background: #f0f0f0;" class="product-item" data-id="${p.id}" data-name="${p.product_name}" data-price="${p.price}">
                    <div>
                        <strong>${p.product_name}</strong><br/>
                        <small style="color: #666;">Stock: ${p.stock_quantity} | Price: ₱${parseFloat(p.price).toFixed(2)}</small>
                    </div>
                    <button type="button" class="btn" style="padding: 5px 10px; font-size: 0.8em;">Add</button>
                </div>
            `).join('');

            // attach click handlers to product items
            productList.querySelectorAll('.product-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const btn = item.querySelector('button');
                    if (e.target === btn || btn.contains(e.target)) {
                        addItemToOrder(item);
                    }
                });
            });
        } catch (err) {
            console.error('Error loading products:', err);
            productList.innerHTML = '<p style="color: red;">Error loading products</p>';
        }
    }

    // load staff members
    async function loadStaffMembers() {
        try {
            // Try to fetch users/staff from API - if not available, use mock data
            staffSelect.innerHTML = '<option value="">-- Select Staff --</option><option value="1">Default Staff</option>';
        } catch (err) {
            console.error('Error loading staff:', err);
        }
    }

    // add item to order
    function addItemToOrder(productItem) {
        const productId = parseInt(productItem.dataset.id);
        const productName = productItem.dataset.name;
        const productPrice = parseFloat(productItem.dataset.price);

        // prompt for quantity
        const quantity = prompt(`How many ${productName}?`, '1');
        if (!quantity || isNaN(parseInt(quantity))) return;

        const qty = parseInt(quantity);
        if (qty <= 0) {
            alert('Quantity must be greater than 0');
            return;
        }

        // check if item already in order
        const existing = orderItems.find(item => item.product_id === productId);
        if (existing) {
            existing.quantity += qty;
        } else {
            orderItems.push({
                product_id: productId,
                product_name: productName,
                price: productPrice,
                quantity: qty
            });
        }

        updateOrderItemsDisplay();
    }

    // update order items display
    function updateOrderItemsDisplay() {
        const itemsDiv = document.getElementById('orderItems');
        if (orderItems.length === 0) {
            itemsDiv.innerHTML = '<p style="color: #999; margin: 0;">No items added yet</p>';
            document.getElementById('orderTotal').textContent = '₱0.00';
            return;
        }

        let total = 0;
        itemsDiv.innerHTML = orderItems.map((item, idx) => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            return `
                <div style="padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${item.product_name}</strong><br/>
                        <small>${item.quantity} × ₱${item.price.toFixed(2)}</small>
                    </div>
                    <div style="text-align: right;">
                        <div><strong>₱${subtotal.toFixed(2)}</strong></div>
                        <button type="button" class="btn danger" style="padding: 3px 8px; font-size: 0.75em; margin-top: 3px;" onclick="removeOrderItem(${idx})">Remove</button>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('orderTotal').textContent = `₱${total.toFixed(2)}`;
    }

    // modal event handlers
    addBtn && addBtn.addEventListener('click', () => {
        orderItems = [];
        form.reset();
        updateOrderItemsDisplay();
        loadProductsForOrder();
        loadStaffMembers();
        modal.classList.add('show');
    });

    closeBtn && closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        orderItems = [];
    });

    modal && modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            orderItems = [];
        }
    });

    form && form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const staffId = parseInt(staffSelect.value);
        
        if (!staffId) {
            alert('Please select a staff member');
            return;
        }

        if (orderItems.length === 0) {
            alert('Please add at least one item to the order');
            return;
        }

        try {
            await request('/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: staffId,
                    items: orderItems.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        price: item.price
                    }))
                })
            });

            modal.classList.remove('show');
            orderItems = [];
            alert('Order created successfully!');
            loadOrders();
        } catch (err) {
            console.error('Error creating order:', err);
            alert('Error creating order');
        }
    });
}

function removeOrderItem(idx) {
    orderItems.splice(idx, 1);
    const itemsDiv = document.getElementById('orderItems');
    if (itemsDiv) {
        updateOrderItemsDisplay();
    }
}

function updateOrderItemsDisplay() {
    const itemsDiv = document.getElementById('orderItems');
    if (!itemsDiv) return;

    if (orderItems.length === 0) {
        itemsDiv.innerHTML = '<p style="color: #999; margin: 0;">No items added yet</p>';
        const totalEl = document.getElementById('orderTotal');
        if (totalEl) totalEl.textContent = '₱0.00';
        return;
    }

    let total = 0;
    itemsDiv.innerHTML = orderItems.map((item, idx) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return `
            <div style="padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${item.product_name}</strong><br/>
                    <small>${item.quantity} × ₱${item.price.toFixed(2)}</small>
                </div>
                <div style="text-align: right;">
                    <div><strong>₱${subtotal.toFixed(2)}</strong></div>
                    <button type="button" class="btn danger" style="padding: 3px 8px; font-size: 0.75em; margin-top: 3px;" onclick="removeOrderItem(${idx})">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    const totalEl = document.getElementById('orderTotal');
    if (totalEl) totalEl.textContent = `₱${total.toFixed(2)}`;
}

// format price as currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

