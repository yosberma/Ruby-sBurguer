/**
 * ============================================================================
 * CONTROLADOR PRINCIPAL PWA: RUBY'S BURGER & DOGS
 * Arquitectura Mobile-First orientada a operaciones internas (POS, Stock, Gastos, Reportes)
 * ============================================================================
 */

const RubyApp = {
  // --------------------------------------------------------------------------
  // 1. ESTADO DE LA APLICACIÓN (STATE)
  // --------------------------------------------------------------------------
  state: {
    currentTab: 'pos',
    currentUser: null,
    cart: [],
    products: [],
    categories: [],
    inventory: [],
    inventorySummary: {},
    expenses: [],
    expensesSummary: {},
    weeklyReport: null,
    activeCategory: 'all',
    searchQuery: '',
    selectedPaymentMethod: 'efectivo',
    currentExpensePeriod: 'week',
    currentInventoryFilter: 'all',
    selectedInsumoForMov: null
  },

  // Tokens iniciales para prueba inmediata en móvil
  predefinedUsers: {
    admin: {
      id: 1,
      nombre: 'Carlos Rodríguez',
      email: 'admin@rubys.com',
      rol: 'admin',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tYnJlIjoiQ2FybG9zIFJvZHLDrWd1ZXogKEFkbWluKSIsImVtYWlsIjoiYWRtaW5AcnVieXMuY29tIiwicm9sIjoiYWRtaW4iLCJpYXQiOjE3OTQzNTQ5NzYsImV4cCI6MTc5NDk1OTc3Nn0.gUFocoO8x3kq2apghc1sS-ZHZeB_sHpH-Nm3gs_9Z6k'
    },
    empleado: {
      id: 2,
      nombre: 'María Morales',
      email: 'cajero@rubys.com',
      rol: 'empleado',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwibm9tYnJlIjoiTWFyw61hIE1vcmFsZXMgKENhamVyYSkiLCJlbWFpbCI6ImNhamVyb0BydWJ5cy5jb20iLCJyb2wiOiJlbXBsZWFkbyIsImlhdCI6MTc5NDM1NDk3NiwiZXhwIjoxNzk0OTU5Nzc2fQ.Q5yNUNsaM20g5F5XJq9ATAExBCH48BKE2rM-94W0rzc'
    }
  },

  // --------------------------------------------------------------------------
  // 2. INICIALIZACIÓN
  // --------------------------------------------------------------------------
  init() {
    console.log("🍔 Iniciando Ruby's Burger & Dogs Mobile POS & Control...");

    // 1. Restaurar o fijar usuario activo (por defecto Admin para pruebas)
    const savedUser = localStorage.getItem('rubys_user');
    if (savedUser) {
      try {
        this.state.currentUser = JSON.parse(savedUser);
      } catch (e) {
        this.state.currentUser = this.predefinedUsers.admin;
      }
    } else {
      this.state.currentUser = this.predefinedUsers.admin;
    }
    this.updateUserUI();

    // 2. Establecer fecha por defecto en formulario de gastos (hoy)
    const expDateInput = document.getElementById('expFechaInput');
    if (expDateInput) {
      expDateInput.value = new Date().toISOString().slice(0, 10);
    }

    // 3. Cargar datos desde Backend API
    this.loadProducts();
    this.loadInventory();
    this.loadExpenses('week');
    this.loadWeeklyReports();

    // 4. Registrar Service Worker para PWA
    this.registerServiceWorker();
  },

  // Helper para llamadas HTTP con cabecera de autenticación
  async apiFetch(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.state.currentUser && this.state.currentUser.token) {
      headers['Authorization'] = `Bearer ${this.state.currentUser.token}`;
    }

    const response = await fetch(url, { ...options, headers });
    return response;
  },

  // --------------------------------------------------------------------------
  // 3. MÓDULO 1: PUNTO DE VENTA RÁPIDO (POS)
  // --------------------------------------------------------------------------
  async loadProducts() {
    try {
      const res = await this.apiFetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        this.state.products = data.products || [];
        this.renderPOSProducts();
      }
    } catch (err) {
      console.warn('Usando catálogo local:', err);
    }
  },

  filterCategory(category, buttonElem) {
    this.state.activeCategory = category;
    if (buttonElem) {
      document.querySelectorAll('#posCategoryTabs .cat-pill').forEach(btn => btn.classList.remove('active'));
      buttonElem.classList.add('active');
    }
    this.renderPOSProducts();
  },

  onSearchInput(value) {
    this.state.searchQuery = value.toLowerCase().trim();
    const clearBtn = document.getElementById('posClearSearch');
    if (clearBtn) clearBtn.style.display = this.state.searchQuery ? 'block' : 'none';
    this.renderPOSProducts();
  },

  clearSearch() {
    this.state.searchQuery = '';
    const input = document.getElementById('posSearchInput');
    if (input) input.value = '';
    const clearBtn = document.getElementById('posClearSearch');
    if (clearBtn) clearBtn.style.display = 'none';
    this.renderPOSProducts();
  },

  renderPOSProducts() {
    const container = document.getElementById('posProductsContainer');
    if (!container) return;

    let filtered = this.state.products;

    if (this.state.activeCategory !== 'all') {
      filtered = filtered.filter(p => p.categoriaNombre === this.state.activeCategory);
    }

    if (this.state.searchQuery) {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(this.state.searchQuery) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(this.state.searchQuery))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: var(--color-text-dim);">
          <span style="font-size: 32px; display: block; margin-bottom: 8px;">🔍</span>
          <p>No se encontraron productos que coincidan.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(prod => {
      const inCart = this.state.cart.find(item => item.product.id === prod.id);
      const qtyInCart = inCart ? inCart.cantidad : 0;

      return `
        <div class="pos-product-card ${qtyInCart > 0 ? 'has-items' : ''}" onclick="RubyApp.quickAddProduct(${prod.id})">
          <div class="card-img-wrapper">
            <img src="${prod.imagen || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'}" alt="${prod.nombre}" loading="lazy">
            ${qtyInCart > 0 ? `<div class="card-qty-badge">${qtyInCart}</div>` : ''}
          </div>
          <div class="card-info">
            <span class="prod-category">${prod.categoriaIcono || '🍔'} ${prod.categoriaNombre}</span>
            <h4 class="prod-name">${prod.nombre}</h4>
            <div class="card-bottom-row">
              <span class="prod-price">$${prod.precio.toFixed(2)}</span>
              <button class="btn-quick-add" onclick="event.stopPropagation(); RubyApp.quickAddProduct(${prod.id})" aria-label="Añadir">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.updateCartFloatingBar();
  },

  quickAddProduct(productId) {
    const prod = this.state.products.find(p => p.id === productId);
    if (!prod) return;

    const existingIndex = this.state.cart.findIndex(i => i.product.id === productId);
    if (existingIndex > -1) {
      this.state.cart[existingIndex].cantidad += 1;
    } else {
      this.state.cart.push({ product: prod, cantidad: 1 });
    }

    this.renderPOSProducts();
    this.updateCartFloatingBar();
  },

  updateCartFloatingBar() {
    const floatingBar = document.getElementById('posFloatingCartBar');
    const lblCount = document.getElementById('lblCartCount');
    const lblTotal = document.getElementById('lblCartTotal');

    const totalQty = this.state.cart.reduce((sum, item) => sum + item.cantidad, 0);
    const totalPrice = this.state.cart.reduce((sum, item) => sum + (item.product.precio * item.cantidad), 0);

    if (lblCount) lblCount.textContent = totalQty;
    if (lblTotal) lblTotal.textContent = `$${totalPrice.toFixed(2)}`;

    if (floatingBar) {
      if (totalQty > 0 && this.state.currentTab === 'pos') {
        floatingBar.style.display = 'flex';
      } else {
        floatingBar.style.display = 'none';
      }
    }
  },

  openCheckoutModal() {
    if (this.state.cart.length === 0) return;
    this.renderCheckoutItems();
    const backdrop = document.getElementById('modalCheckoutBackdrop');
    if (backdrop) backdrop.classList.add('open');
  },

  closeCheckoutModal(event) {
    if (event && event.target && event.target.id !== 'modalCheckoutBackdrop') return;
    const backdrop = document.getElementById('modalCheckoutBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  },

  renderCheckoutItems() {
    const list = document.getElementById('checkoutItemsList');
    const lblTotal = document.getElementById('checkoutFinalTotal');
    if (!list) return;

    const totalPrice = this.state.cart.reduce((sum, item) => sum + (item.product.precio * item.cantidad), 0);
    if (lblTotal) lblTotal.textContent = `$${totalPrice.toFixed(2)}`;

    list.innerHTML = this.state.cart.map(item => `
      <div class="checkout-item-row">
        <div class="ci-info">
          <h5>${item.product.nombre}</h5>
          <span class="ci-price">$${item.product.precio.toFixed(2)} c/u</span>
        </div>
        <div class="ci-controls">
          <button class="ci-btn" onclick="RubyApp.adjustCartQty(${item.product.id}, -1)">-</button>
          <span class="ci-qty">${item.cantidad}</span>
          <button class="ci-btn" onclick="RubyApp.adjustCartQty(${item.product.id}, 1)">+</button>
        </div>
      </div>
    `).join('');
  },

  adjustCartQty(productId, delta) {
    const index = this.state.cart.findIndex(i => i.product.id === productId);
    if (index === -1) return;

    this.state.cart[index].cantidad += delta;
    if (this.state.cart[index].cantidad <= 0) {
      this.state.cart.splice(index, 1);
    }

    if (this.state.cart.length === 0) {
      this.closeCheckoutModal();
    } else {
      this.renderCheckoutItems();
    }
    this.renderPOSProducts();
    this.updateCartFloatingBar();
  },

  setPaymentMethod(method) {
    this.state.selectedPaymentMethod = method;
    document.querySelectorAll('.payment-opt-card').forEach(card => card.classList.remove('active'));
    const activeRadio = document.querySelector(`input[name="payMethod"][value="${method}"]`);
    if (activeRadio && activeRadio.closest('.payment-opt-card')) {
      activeRadio.closest('.payment-opt-card').classList.add('active');
    }
  },

  async submitSale() {
    if (this.state.cart.length === 0) return;

    const btn = document.getElementById('btnConfirmSale');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Procesando Venta...</span>';
    }

    const payload = {
      items: this.state.cart.map(item => ({
        productoId: item.product.id,
        cantidad: item.cantidad,
        precioUnitario: item.product.precio
      })),
      metodoPago: this.state.selectedPaymentMethod,
      notas: (document.getElementById('checkoutNotesInput')?.value || '').trim()
    };

    try {
      const res = await this.apiFetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar la venta');

      // Cerrar checkout y limpiar carrito
      this.closeCheckoutModal();
      this.state.cart = [];
      this.renderPOSProducts();
      this.updateCartFloatingBar();

      // Mostrar Ticket de Confirmación con alertas de stock
      this.showReceiptModal(data.venta);

      // Recargar inventario y reportes en background
      this.loadInventory();
      this.loadWeeklyReports();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>✅ Confirmar & Cobrar Venta</span>';
      }
    }
  },

  showReceiptModal(venta) {
    const backdrop = document.getElementById('modalReceiptBackdrop');
    if (!backdrop) return;

    document.getElementById('rcptCode').textContent = venta.codigoFactura;
    document.getElementById('rcptTimestamp').textContent = new Date().toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    document.getElementById('rcptPaymentMethod').textContent = venta.metodoPago.toUpperCase();
    document.getElementById('rcptTotalAmount').textContent = `$${venta.total.toFixed(2)}`;

    // Tabla de ítems
    const itemsTable = document.getElementById('rcptItemsTable');
    itemsTable.innerHTML = venta.items.map(it => `
      <div class="rcpt-item-line">
        <span>${it.cantidad}x ${it.nombre}</span>
        <strong>$${it.subtotal.toFixed(2)}</strong>
      </div>
    `).join('');

    // Alertas de stock bajo originadas por la receta de esta venta
    const alertBanner = document.getElementById('rcptStockAlertBanner');
    const alertList = document.getElementById('rcptStockAlertList');

    if (venta.alertasStock && venta.alertasStock.length > 0) {
      alertBanner.style.display = 'block';
      alertList.innerHTML = venta.alertasStock.map(a => `
        <div style="margin-top: 4px;">
          • <strong>${a.nombre}</strong>: Quedan solo ${a.stockActual} ${a.unidad} (Mínimo: ${a.stockMinimo})
        </div>
      `).join('');
    } else {
      alertBanner.style.display = 'none';
      alertList.innerHTML = '';
    }

    backdrop.classList.add('open');
  },

  closeReceiptModal(event) {
    if (event && event.target && event.target.id !== 'modalReceiptBackdrop') return;
    const backdrop = document.getElementById('modalReceiptBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  },

  // --------------------------------------------------------------------------
  // 4. MÓDULO 2: CONTROL DE INVENTARIO Y MERCANCÍA
  // --------------------------------------------------------------------------
  async loadInventory() {
    try {
      const res = await this.apiFetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        this.state.inventory = data.insumos || [];
        this.state.inventorySummary = data.resumen || {};
        this.renderInventoryKPIs();
        this.renderInventoryItems();
        this.populateMovementSelect();
      }
    } catch (err) {
      console.warn('Error al cargar inventario:', err);
    }
  },

  renderInventoryKPIs() {
    const s = this.state.inventorySummary;
    document.getElementById('lblTotalInsumos').textContent = s.totalItems || this.state.inventory.length;
    document.getElementById('lblAlertasInsumos').textContent = s.alertasTotales || 0;
    document.getElementById('lblValorAlmacen').textContent = `$${(s.valorTotalInventario || 0).toFixed(2)}`;

    // Punto rojo de advertencia en el tab bar inferior si hay alertas
    const dot = document.getElementById('navInventoryBadge');
    if (dot) {
      dot.style.display = (s.alertasTotales > 0) ? 'block' : 'none';
    }
  },

  filterInventory(filter, btnElem) {
    this.state.currentInventoryFilter = filter;
    document.querySelectorAll('#inventoryFilters .inv-filter-btn').forEach(b => b.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');
    this.renderInventoryItems();
  },

  renderInventoryItems() {
    const container = document.getElementById('inventoryItemsContainer');
    if (!container) return;

    let items = this.state.inventory;

    if (this.state.currentInventoryFilter === 'alertas') {
      items = items.filter(i => i.estado === 'agotado' || i.estado === 'critico' || i.estado === 'bajo');
    } else if (this.state.currentInventoryFilter !== 'all') {
      items = items.filter(i => i.categoria === this.state.currentInventoryFilter);
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--color-text-dim);">
          <span style="font-size: 30px; display:block; margin-bottom: 6px;">📦</span>
          <p>No hay insumos para este filtro.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="inventory-item-card state-${item.estado}">
        <div class="item-top-row">
          <div class="item-title-box">
            <h4>${item.nombre}</h4>
            <span class="item-category-tag">${item.categoria} • ${item.proveedor_habitual || 'Proveedor General'}</span>
          </div>
          <span class="stock-status-pill ${item.estadoColor}">${item.estadoTexto}</span>
        </div>

        <div class="stock-progress-container">
          <div class="progress-track">
            <div class="progress-bar ${item.estadoColor}" style="width: ${item.porcentajeStock}%;"></div>
          </div>
        </div>

        <div class="item-footer-metrics">
          <div class="stock-numbers">
            Actual: <strong>${item.stock_actual} ${item.unidad_medida}</strong> (Mín: ${item.stock_minimo})
          </div>
          <button class="btn-card-mov" onclick="RubyApp.openMovementModal(${item.id})">+ Movimiento</button>
        </div>
      </div>
    `).join('');
  },

  populateMovementSelect() {
    const select = document.getElementById('movInsumoSelect');
    if (!select) return;
    select.innerHTML = this.state.inventory.map(i => `
      <option value="${i.id}">${i.nombre} (Stock actual: ${i.stock_actual} ${i.unidad_medida})</option>
    `).join('');
  },

  openMovementModal(insumoId = null) {
    const backdrop = document.getElementById('modalMovementBackdrop');
    if (insumoId) {
      const select = document.getElementById('movInsumoSelect');
      if (select) select.value = insumoId;
    }
    if (backdrop) backdrop.classList.add('open');
  },

  closeMovementModal(event) {
    if (event && event.target && event.target.id !== 'modalMovementBackdrop') return;
    const backdrop = document.getElementById('modalMovementBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  },

  onMovementTypeChange(type) {
    const lbl = document.getElementById('lblMovCantidad');
    if (!lbl) return;
    if (type === 'entrada_compra') lbl.textContent = 'Cantidad a Ingresar / Reabastecer:';
    else if (type === 'merma') lbl.textContent = 'Cantidad Desechada / Merma:';
    else if (type === 'ajuste') lbl.textContent = 'Nuevo Stock Real (Conteo Físico):';
  },

  async submitMovement(e) {
    e.preventDefault();
    const insumoId = parseInt(document.getElementById('movInsumoSelect').value, 10);
    const tipo = document.getElementById('movTipoSelect').value;
    const cantidad = parseFloat(document.getElementById('movCantidadInput').value);
    const motivo = document.getElementById('movMotivoInput').value;

    try {
      const res = await this.apiFetch('/api/inventory/movement', {
        method: 'POST',
        body: JSON.stringify({ insumoId, tipo, cantidad, motivo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar movimiento');

      this.closeMovementModal();
      document.getElementById('movCantidadInput').value = '';
      document.getElementById('movMotivoInput').value = '';
      this.loadInventory();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  },

  // --------------------------------------------------------------------------
  // 5. MÓDULO 3: GESTIÓN DE GASTOS Y COMPRAS
  // --------------------------------------------------------------------------
  async loadExpenses(period = 'week') {
    this.state.currentExpensePeriod = period;
    try {
      const res = await this.apiFetch(`/api/expenses?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        this.state.expenses = data.gastos || [];
        this.state.expensesSummary = {
          total: data.totalMonto || 0,
          cantidad: data.cantidadGastos || 0,
          porCategoria: data.porCategoria || {}
        };
        this.renderExpensesView();
      }
    } catch (err) {
      console.warn('Error al cargar gastos:', err);
    }
  },

  filterExpensesPeriod(period, btnElem) {
    document.querySelectorAll('.timeframe-selector .timeframe-pill').forEach(b => b.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');
    this.loadExpenses(period);
  },

  renderExpensesView() {
    const lblTotal = document.getElementById('lblTotalGastosPeriodo');
    const lblCantidad = document.getElementById('lblCantidadGastos');
    const chipsContainer = document.getElementById('expensesCategoryBreakdown');
    const listContainer = document.getElementById('expensesListContainer');

    if (lblTotal) lblTotal.textContent = `$${(this.state.expensesSummary.total || 0).toFixed(2)}`;
    if (lblCantidad) lblCantidad.textContent = `${this.state.expensesSummary.cantidad || 0} compras registradas`;

    // Chips por categoría
    if (chipsContainer && this.state.expensesSummary.porCategoria) {
      const cats = this.state.expensesSummary.porCategoria;
      chipsContainer.innerHTML = Object.keys(cats).map(catName => `
        <div class="category-chip">
          <span>${catName}:</span>
          <strong>$${cats[catName].total.toFixed(2)}</strong>
        </div>
      `).join('');
    }

    // Lista de gastos
    if (listContainer) {
      if (this.state.expenses.length === 0) {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 30px; color: var(--color-text-dim);">
            <span style="font-size: 30px; display:block; margin-bottom: 6px;">💸</span>
            <p>No hay egresos registrados en este período.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = this.state.expenses.map(exp => `
        <div class="expense-row-card">
          <div class="exp-left">
            <div class="exp-icon-box">📉</div>
            <div class="exp-details">
              <h4>${exp.descripcion}</h4>
              <div class="exp-meta">
                <span>${exp.fecha}</span> • 
                <span>${exp.categoria}</span>
                ${exp.comprobante ? ` • <small>${exp.comprobante}</small>` : ''}
              </div>
            </div>
          </div>
          <div class="exp-right">
            <span class="exp-amount">-$${Number(exp.monto).toFixed(2)}</span>
            <span class="exp-supplier">${exp.proveedor || 'General'}</span>
          </div>
        </div>
      `).join('');
    }
  },

  openExpenseModal() {
    const backdrop = document.getElementById('modalExpenseBackdrop');
    if (backdrop) backdrop.classList.add('open');
  },

  closeExpenseModal(event) {
    if (event && event.target && event.target.id !== 'modalExpenseBackdrop') return;
    const backdrop = document.getElementById('modalExpenseBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  },

  async submitExpense(e) {
    e.preventDefault();
    const descripcion = document.getElementById('expDescInput').value;
    const categoria = document.getElementById('expCategorySelect').value;
    const monto = parseFloat(document.getElementById('expMontoInput').value);
    const fecha = document.getElementById('expFechaInput').value;
    const proveedor = document.getElementById('expProveedorInput').value;
    const comprobante = document.getElementById('expComprobanteInput').value;

    try {
      const res = await this.apiFetch('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({ descripcion, categoria, monto, fecha, proveedor, comprobante })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar gasto');

      this.closeExpenseModal();
      document.getElementById('expDescInput').value = '';
      document.getElementById('expMontoInput').value = '';
      document.getElementById('expProveedorInput').value = '';
      document.getElementById('expComprobanteInput').value = '';

      this.loadExpenses(this.state.currentExpensePeriod);
      this.loadWeeklyReports();
    } catch (err) {
      alert(`⚠️ ${err.message}`);
    }
  },

  // --------------------------------------------------------------------------
  // 6. MÓDULO 4: REPORTES DE ESTADÍSTICAS SEMANALES
  // --------------------------------------------------------------------------
  async loadWeeklyReports() {
    try {
      const res = await this.apiFetch('/api/reports/weekly');
      if (res.ok) {
        const data = await res.json();
        this.state.weeklyReport = data;
        this.renderWeeklyReportsView();
      }
    } catch (err) {
      console.warn('Error al cargar reportes:', err);
    }
  },

  renderWeeklyReportsView() {
    const rep = this.state.weeklyReport;
    if (!rep) return;

    // Rango de fechas
    const rangeElem = document.getElementById('lblReportPeriodRange');
    if (rangeElem && rep.semana) {
      rangeElem.textContent = `Semana: ${rep.semana.desde} al ${rep.semana.hasta}`;
    }

    // KPIs
    const m = rep.metricasClave;
    document.getElementById('repTotalVentas').textContent = `$${m.totalVentas.toFixed(2)}`;
    document.getElementById('repTransacciones').textContent = `${m.totalTransacciones} órdenes`;
    document.getElementById('repTicketPromedio').textContent = `Ticket: $${m.ticketPromedio.toFixed(2)}`;

    document.getElementById('repTotalGastos').textContent = `$${m.totalGastos.toFixed(2)}`;

    const balanceElem = document.getElementById('repBalanceNeto');
    balanceElem.textContent = `${m.balanceNeto >= 0 ? '+' : ''}$${m.balanceNeto.toFixed(2)}`;
    balanceElem.style.color = m.balanceNeto >= 0 ? 'var(--color-success)' : 'var(--color-danger)';

    const margenBadge = document.getElementById('repMargenBadge');
    margenBadge.textContent = `Margen: ${m.margenGanancia}%`;
    margenBadge.style.color = m.margenGanancia >= 0 ? 'var(--color-success)' : 'var(--color-danger)';

    // Gráfico Diario SVG (Ventas vs Gastos)
    this.renderDailySVGChart(rep.graficoDiario || []);

    // Top 5 Productos
    this.renderTopProducts(rep.topProductos || []);

    // Métodos de Pago
    this.renderPaymentDistribution(rep.metodosPago || []);
  },

  renderDailySVGChart(dias) {
    const container = document.getElementById('dailyChartContainer');
    if (!container || dias.length === 0) return;

    const maxVal = Math.max(...dias.map(d => Math.max(d.ventas, d.gastos)), 20);
    const chartHeight = 140;
    const chartWidth = 340;
    const colWidth = chartWidth / dias.length;
    const barWidth = 14;

    const svgBars = dias.map((d, i) => {
      const xCenter = i * colWidth + (colWidth / 2);
      const vHeight = Math.max(2, (d.ventas / maxVal) * chartHeight);
      const gHeight = Math.max(2, (d.gastos / maxVal) * chartHeight);

      const vY = chartHeight - vHeight + 10;
      const gY = chartHeight - gHeight + 10;

      return `
        <!-- Barra Ventas -->
        <rect x="${xCenter - barWidth - 1}" y="${vY}" width="${barWidth}" height="${vHeight}" rx="4" fill="#FFB703" opacity="0.95">
          <title>${d.dia} (${d.fecha}): Ventas $${d.ventas.toFixed(2)}</title>
        </rect>
        <!-- Barra Gastos -->
        <rect x="${xCenter + 1}" y="${gY}" width="${barWidth}" height="${gHeight}" rx="4" fill="#EF4444" opacity="0.95">
          <title>${d.dia} (${d.fecha}): Gastos $${d.gastos.toFixed(2)}</title>
        </rect>
        <!-- Etiqueta Día -->
        <text x="${xCenter}" y="${chartHeight + 25}" font-size="11" fill="#94A3B8" text-anchor="middle" font-weight="700">
          ${d.dia}
        </text>
      `;
    }).join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${chartWidth} ${chartHeight + 35}" width="100%" height="100%" preserveAspectRatio="none">
        <line x1="0" y1="${chartHeight + 10}" x2="${chartWidth}" y2="${chartHeight + 10}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
        ${svgBars}
      </svg>
    `;
  },

  renderTopProducts(top) {
    const container = document.getElementById('topProductsList');
    if (!container) return;

    if (top.length === 0) {
      container.innerHTML = `<p style="color:var(--color-text-dim); text-align:center; padding:10px;">Aún no hay ventas registradas esta semana.</p>`;
      return;
    }

    const maxUnits = Math.max(...top.map(t => t.total_unidades), 1);

    container.innerHTML = top.map((prod, index) => {
      const pct = Math.round((prod.total_unidades / maxUnits) * 100);
      return `
        <div class="top-prod-row">
          <span class="top-rank-num">#${index + 1}</span>
          <div class="top-prod-info">
            <div class="top-prod-labels">
              <span>${prod.categoria_icono || '🍔'} ${prod.nombre}</span>
              <strong>${prod.total_unidades} un. ($${prod.total_ingresos.toFixed(2)})</strong>
            </div>
            <div class="top-progress-bar">
              <div class="top-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderPaymentDistribution(metodos) {
    const container = document.getElementById('paymentMethodsDistribution');
    if (!container) return;

    const icons = {
      efectivo: '💵 Efectivo',
      tarjeta: '💳 Tarjeta / Punto',
      pago_movil: '📲 Pago Móvil',
      zelle: '⚡ Zelle',
      transferencia: '🏦 Transferencia'
    };

    container.innerHTML = metodos.map(m => `
      <div class="pay-dist-card">
        <div class="pay-dist-header">
          <span>${icons[m.metodo_pago] || m.metodo_pago}</span>
          <span>${m.transacciones} ops</span>
        </div>
        <strong class="pay-dist-amount">$${Number(m.total_monto).toFixed(2)}</strong>
      </div>
    `).join('');
  },

  // --------------------------------------------------------------------------
  // 7. GESTIÓN DE ROLES Y NAVEGACIÓN
  // --------------------------------------------------------------------------
  switchTab(tabName, tabElem) {
    this.state.currentTab = tabName;

    // Cambiar estilos activos en nav
    document.querySelectorAll('.bottom-nav-bar .nav-tab').forEach(t => t.classList.remove('active'));
    if (tabElem) tabElem.classList.add('active');

    // Cambiar vistas visibles
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) targetView.classList.add('active');

    // Manejar barra flotante de carrito
    this.updateCartFloatingBar();

    // Actualizaciones según tab
    if (tabName === 'inventory') this.loadInventory();
    if (tabName === 'expenses') this.loadExpenses(this.state.currentExpensePeriod);
    if (tabName === 'reports') this.loadWeeklyReports();
    if (tabName === 'user') this.openUserModal();
  },

  quickSwitchRole(role) {
    if (role === 'admin') {
      this.state.currentUser = this.predefinedUsers.admin;
    } else {
      this.state.currentUser = this.predefinedUsers.empleado;
    }
    localStorage.setItem('rubys_user', JSON.stringify(this.state.currentUser));
    this.updateUserUI();
    this.closeUserModal();

    // Actualizar datos de acuerdo al nuevo rol
    this.loadInventory();
    this.loadExpenses(this.state.currentExpensePeriod);
    this.loadWeeklyReports();
  },

  updateUserUI() {
    const u = this.state.currentUser || this.predefinedUsers.admin;
    const initials = u.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    // Header badge
    const roleBadge = document.getElementById('lblUserRoleText');
    const roleChip = document.getElementById('lblUserRoleBadge');
    const avatar = document.getElementById('lblUserAvatar');

    if (roleBadge) roleBadge.textContent = u.rol === 'admin' ? '👑 Admin' : '🧑‍🍳 Empleado';
    if (avatar) avatar.textContent = initials;

    // Modal de usuario
    const sheetAvatar = document.getElementById('sheetUserAvatar');
    const sheetName = document.getElementById('sheetUserName');
    const sheetEmail = document.getElementById('sheetUserEmail');
    const sheetRoleBadge = document.getElementById('sheetUserRoleBadge');

    if (sheetAvatar) sheetAvatar.textContent = initials;
    if (sheetName) sheetName.textContent = u.nombre;
    if (sheetEmail) sheetEmail.textContent = u.email;
    if (sheetRoleBadge) sheetRoleBadge.textContent = `Rol: ${u.rol === 'admin' ? 'Administrador' : 'Empleado / Cajera'}`;

    // Botones activos de cambio de rol
    const btnAdmin = document.getElementById('btnRoleAdmin');
    const btnEmpleado = document.getElementById('btnRoleEmpleado');
    if (btnAdmin && btnEmpleado) {
      btnAdmin.classList.toggle('active', u.rol === 'admin');
      btnEmpleado.classList.toggle('active', u.rol === 'empleado');
    }
  },

  openUserModal() {
    const backdrop = document.getElementById('modalUserBackdrop');
    if (backdrop) backdrop.classList.add('open');
  },

  closeUserModal(event) {
    if (event && event.target && event.target.id !== 'modalUserBackdrop') return;
    const backdrop = document.getElementById('modalUserBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('📱 PWA Service Worker registrado con éxito:', reg.scope))
          .catch(err => console.warn('Fallo registro Service Worker:', err));
      });
    }
  }
};

// Arrancar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  RubyApp.init();
});
