/**
 * ============================================================================
 * SISTEMA PRINCIPAL DE LA APLICACIÓN MÓVIL: RUBY'S BURGER
 * Arquitectura modular orientada a procesos (Fichas Técnicas)
 * Desarrollado para entorno Google Antigravity / Navegadores Móviles
 * ============================================================================
 */

// Objeto global de encapsulación de la aplicación (Namespace Pattern)
// Evita la contaminación del ámbito global y agrupa el estado y controladores.
const RubyApp = {

  // --------------------------------------------------------------------------
  // 1. ESTADO DE LA APLICACIÓN (APPLICATION STATE)
  // --------------------------------------------------------------------------
  state: {
    // Vista actualmente visible en pantalla ('home' | 'menu' | 'order' | 'status' | 'contact')
    currentView: 'home',

    // Arreglo reactivo de productos añadidos al carrito de compras
    cart: [],

    // Modalidad de entrega seleccionada: 'delivery' (a domicilio) o 'pickup' (retiro en local)
    deliveryMode: 'delivery',

    // Costos operativos y tarifas fijas
    costDelivery: 2.00,
    taxRate: 0.08, // Tasa de impuesto IVA del 8%

    // Objeto de la orden actualmente activa para seguimiento en tiempo real
    activeOrder: null,

    // Referencia al temporizador de cuenta regresiva del pedido activo
    timerInterval: null,

    // Producto temporal que se está configurando en el modal de personalización
    currentModalProduct: null,
    currentModalQty: 1
  },

  // --------------------------------------------------------------------------
  // 2. BASE DE DATOS LOCAL: CATÁLOGO DE PRODUCTOS Y ESPECIALIDADES
  // --------------------------------------------------------------------------
  catalog: [
    {
      id: 1,
      category: 'burgers',
      name: 'Ruby Monster Double Smash',
      tag: '🔥 La Más Vendida',
      price: 8.99,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      description: 'Doble torta smash de res Angus 120g, doble queso cheddar fundido, tocineta crujiente ahumada al manzano, cebolla caramelizada y salsa Ruby secreta en pan brioche artesanal.',
      isTopSeller: true
    },
    {
      id: 2,
      category: 'burgers',
      name: 'Ruby Classic Bacon BBQ',
      tag: '⭐ Favorita',
      price: 7.99,
      image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80',
      description: 'Carne de res 160g cocinada a la parrilla, salsa barbacoa ahumada, tiras de tocineta gruesa, pepinillos encurtidos y aros de cebolla crocantes.',
      isTopSeller: true
    },
    {
      id: 3,
      category: 'burgers',
      name: 'Fire Jalapeño Volcano',
      tag: '🌶️ Nivel Picante',
      price: 8.49,
      image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80',
      description: 'Para los amantes del picante: carne selecta con queso pepper jack, rodajas de jalapeños encurtidos a la brasa, mayonesa sriracha y lechuga fresca.',
      isTopSeller: false
    },
    {
      id: 4,
      category: 'burgers',
      name: 'Crispy Ruby Chicken',
      tag: '🍗 Pollo Crujiente',
      price: 7.49,
      image: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80',
      description: 'Pechuga de pollo marinada 24 horas y apanada con receta secreta extracrujiente, ensalada coleslaw cremosa, pepinillos y salsa de mostaza miel.',
      isTopSeller: true
    },
    {
      id: 5,
      category: 'burgers',
      name: 'Green Ruby Plant-Based',
      tag: '🌱 100% Veggie',
      price: 8.29,
      image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=600&q=80',
      description: 'Medallón a base de plantas con sabor y textura idéntica a la res, queso vegano derretido, aguacate fresco, tomate de huerto y mayonesa vegana.',
      isTopSeller: false
    },
    {
      id: 6,
      category: 'sides',
      name: 'Papas Fritas Trufadas Ruby',
      tag: '🍟 Acompañante',
      price: 3.99,
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
      description: 'Papas corte rústico crujientes bañadas en aceite de trufa blanca, queso parmesano rallado y perejil fresco picado.',
      isTopSeller: true
    },
    {
      id: 7,
      category: 'sides',
      name: 'Aros de Cebolla a la Cerveza',
      tag: '🧅 Crujiente',
      price: 3.49,
      image: 'https://images.unsplash.com/photo-1639024471287-032f667056ce?auto=format&fit=crop&w=600&q=80',
      description: 'Aros de cebolla dulce rebozados en masa crujiente de cerveza artesanal rubia, servidos con salsa tártara de la casa.',
      isTopSeller: false
    },
    {
      id: 8,
      category: 'sides',
      name: 'Tequeños de Queso Fundente (5 un.)',
      tag: '🧀 Para Compartir',
      price: 4.50,
      image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=600&q=80',
      description: 'Dedos de masa hojaldrada crujiente rellenos de queso blanco fundente, acompañados de salsa dulce de maracuyá picante.',
      isTopSeller: false
    },
    {
      id: 9,
      category: 'drinks',
      name: 'Malteada Espesa Shake Red Ruby',
      tag: '🥤 Especialidad',
      price: 4.25,
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80',
      description: 'Helado cremoso de fresa y vainilla, sirope artesanal de frutos rojos, crema chantilly montada y una cereza confitada encima.',
      isTopSeller: true
    },
    {
      id: 10,
      category: 'drinks',
      name: 'Limonada de Fresa & Menta',
      tag: '🍋 Refrescante',
      price: 2.75,
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
      description: 'Zumo de limones recién exprimidos, infusión de menta fresca y macerado de fresas maduras con hielo frappe.',
      isTopSeller: false
    },
    {
      id: 11,
      category: 'desserts',
      name: 'Brownie Bombón con Helado',
      tag: '🍫 Postre',
      price: 3.95,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
      description: 'Bizcocho tibio de chocolate semiamargo y nueces pecanas, servido con una bola de helado de vainilla bourbon y fudge caliente.',
      isTopSeller: false
    }
  ],

  // --------------------------------------------------------------------------
  // 3. INICIALIZACIÓN DEL SISTEMA (BOOTSTRAP)
  // --------------------------------------------------------------------------
  init() {
    console.log("Inicializando sistema móvil Ruby's Burger...");

    // Recupera información persistida en el navegador (Local Storage)
    this.loadStateFromStorage();

    // Inicia el reloj dinámico de la barra superior tipo smartphone
    this.initClock();

    // Renderiza la cuadrícula completa de productos del menú
    this.renderCatalog(this.catalog);

    // Renderiza los productos más vendidos en el carrusel de Inicio
    this.renderTopSellers();

    // Actualiza los contadores de la cesta en los badges de la interfaz
    this.updateCartBadges();

    // Renderiza el estado del pedido activo o inicializa una demostración
    this.setupInitialOrder();

    // Registra Service Worker para capacidades offline PWA si está soportado
    this.registerServiceWorker();

    console.log("Sistema Ruby's Burger listo y operativo.");
  },

  // --------------------------------------------------------------------------
  // 4. MÓDULO DE NAVEGACIÓN Y ENRUTAMIENTO DE PANTALLAS
  // --------------------------------------------------------------------------
  /**
   * Navega de manera fluida entre las distintas pantallas de la aplicación.
   * @param {string} viewId - Identificador de la vista ('home', 'menu', 'order', 'status', 'contact')
   */
  navigateTo(viewId) {
    // 1. Ocultar todas las pantallas desactivando la clase .active
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.remove('active'));

    // 2. Buscar la pantalla solicitada y activarla
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
      targetView.classList.add('active');
      this.state.currentView = viewId;
    }

    // 3. Actualizar la barra de navegación inferior (Tab Bar)
    const tabButtons = document.querySelectorAll('.tab-item');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Capitalizar la primera letra para emparejar con el id del botón de la tab bar
    const tabId = 'tabNav' + viewId.charAt(0).toUpperCase() + viewId.slice(1);
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
      activeTab.classList.add('active');
    }

    // 4. Si la vista es la orden ('order'), refrescar el listado de productos y totales
    if (viewId === 'order') {
      this.renderCart();
    }

    // 5. Si la vista es el estatus ('status'), refrescar el stepper visual
    if (viewId === 'status') {
      this.renderOrderStatus();
    }

    // 6. Hacer scroll suave al inicio de la pantalla
    const mainContainer = document.querySelector('.app-main-content');
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
  },

  // --------------------------------------------------------------------------
  // 5. PROCESO 1: VER MENÚ (CATÁLOGO DE PRODUCTOS Y ESPECIALIDADES)
  // --------------------------------------------------------------------------
  /**
   * Renderiza las tarjetas de productos dentro de la cuadrícula del catálogo.
   * @param {Array} items - Lista de productos a renderizar
   */
  renderCatalog(items) {
    const container = document.getElementById('productsCatalogContainer');
    if (!container) return;

    // Validación si la búsqueda o filtro no arrojó resultados
    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--color-text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🔍</div>
          <p>No se encontraron delicias con ese criterio.</p>
          <button onclick="RubyApp.clearMenuSearch()" style="margin-top: 10px; background: var(--color-card-alt); border: 1px solid var(--color-border); color: #fff; padding: 6px 14px; border-radius: 8px; cursor: pointer;">Limpiar búsqueda</button>
        </div>
      `;
      return;
    }

    // Generación dinámica del marcado HTML para cada producto
    container.innerHTML = items.map(product => `
      <article class="product-item-card" onclick="RubyApp.openDirectProductModal(${product.id})">
        <div class="product-card-img-wrap">
          <img src="${product.image}" alt="${product.name}" class="product-card-img" loading="lazy">
          <span class="product-card-badge">${product.tag}</span>
        </div>
        <div class="product-card-content">
          <div>
            <h3 class="product-card-title">${product.name}</h3>
            <p class="product-card-ingredients">${product.description}</p>
          </div>
          <div class="product-card-bottom">
            <span class="product-card-price">$${product.price.toFixed(2)}</span>
            <button class="btn-add-product" onclick="event.stopPropagation(); RubyApp.openDirectProductModal(${product.id})">
              <span>+ Pedir</span>
            </button>
          </div>
        </div>
      </article>
    `).join('');
  },

  /**
   * Filtra los productos en pantalla por categoría gastronómica.
   * @param {string} categoryKey - 'all' | 'burgers' | 'sides' | 'drinks' | 'desserts'
   * @param {HTMLElement} clickedBtn - Botón presionado para marcar estilo activo
   */
  filterCategory(categoryKey, clickedBtn) {
    // Actualizar estilo visual activo de las píldoras de navegación
    const pills = document.querySelectorAll('.cat-pill');
    pills.forEach(p => p.classList.remove('active'));
    if (clickedBtn) {
      clickedBtn.classList.add('active');
    }

    // Limpiar campo de búsqueda textual para evitar conflictos
    const searchInput = document.getElementById('menuSearchInput');
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('btnClearSearch');
    if (clearBtn) clearBtn.style.display = 'none';

    // Aplicar filtro sobre el catálogo
    if (categoryKey === 'all') {
      this.renderCatalog(this.catalog);
    } else {
      const filtered = this.catalog.filter(item => item.category === categoryKey);
      this.renderCatalog(filtered);
    }
  },

  /**
   * Búsqueda en tiempo real de productos por nombre o descripción.
   * @param {string} query - Cadena de texto escrita por el usuario
   */
  filterMenuSearch(query) {
    const term = query.trim().toLowerCase();
    const clearBtn = document.getElementById('btnClearSearch');
    
    // Mostrar u ocultar botón de limpieza rápida
    if (clearBtn) {
      clearBtn.style.display = term.length > 0 ? 'inline-block' : 'none';
    }

    if (!term) {
      this.renderCatalog(this.catalog);
      return;
    }

    const matches = this.catalog.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.description.toLowerCase().includes(term)
    );
    this.renderCatalog(matches);
  },

  /**
   * Limpia el campo de búsqueda y restaura el menú completo.
   */
  clearMenuSearch() {
    const input = document.getElementById('menuSearchInput');
    if (input) input.value = '';
    const clearBtn = document.getElementById('btnClearSearch');
    if (clearBtn) clearBtn.style.display = 'none';
    this.renderCatalog(this.catalog);
  },

  /**
   * Renderiza el carrusel de productos más vendidos en el Home.
   */
  renderTopSellers() {
    const container = document.getElementById('featuredItemsContainer');
    if (!container) return;

    const topItems = this.catalog.filter(item => item.isTopSeller);
    container.innerHTML = topItems.map(item => `
      <div class="mini-product-card" onclick="RubyApp.openDirectProductModal(${item.id})">
        <img src="${item.image}" alt="${item.name}" class="mini-card-img" loading="lazy">
        <h4 class="mini-card-title">${item.name}</h4>
        <span class="mini-card-price">$${item.price.toFixed(2)}</span>
      </div>
    `).join('');
  },

  // --------------------------------------------------------------------------
  // 6. PROCESO 2: HACER PEDIDO (CONFIGURACIÓN DE ORDEN Y CHECKOUT)
  // --------------------------------------------------------------------------
  /**
   * Abre el modal interactivo de personalización para el producto seleccionado.
   * @param {number} productId - Identificador del producto
   */
  openDirectProductModal(productId) {
    const product = this.catalog.find(p => p.id === productId);
    if (!product) return;

    this.state.currentModalProduct = product;
    this.state.currentModalQty = 1;

    const modalTitle = document.getElementById('modalProductTitle');
    const modalContent = document.getElementById('modalProductContent');
    const modalQty = document.getElementById('modalQtyDisplay');
    const modalPrice = document.getElementById('modalFinalPrice');
    const modalBackdrop = document.getElementById('productModalBackdrop');

    if (modalTitle) modalTitle.textContent = `Personalizar ${product.name}`;
    if (modalQty) modalQty.textContent = '1';
    if (modalPrice) modalPrice.textContent = `$${product.price.toFixed(2)}`;

    // Construcción del contenido del modal según el tipo de producto
    if (modalContent) {
      const isBurger = product.category === 'burgers';

      modalContent.innerHTML = `
        <div class="modal-product-hero">
          <img src="${product.image}" alt="${product.name}" class="modal-product-img">
          <div class="modal-hero-details">
            <h4>${product.name}</h4>
            <p>${product.description}</p>
          </div>
        </div>

        ${isBurger ? `
          <!-- Opción 1: Tipo de Pan -->
          <div class="modal-opt-section">
            <label class="modal-opt-title">1. Elige tu tipo de pan:</label>
            <div class="opt-pill-group" id="breadOptionGroup">
              <span class="opt-radio-pill selected" onclick="RubyApp.selectPillOption(this, 'breadOptionGroup')">🧈 Pan Brioche Mantequilla</span>
              <span class="opt-radio-pill" onclick="RubyApp.selectPillOption(this, 'breadOptionGroup')">🥖 Pan Clásico Ajonjolí</span>
              <span class="opt-radio-pill" onclick="RubyApp.selectPillOption(this, 'breadOptionGroup')">🌾 Pan Sin Gluten (+$0.75)</span>
            </div>
          </div>

          <!-- Opción 2: Término de la Carne -->
          <div class="modal-opt-section">
            <label class="modal-opt-title">2. Término de cocción:</label>
            <div class="opt-pill-group" id="donenessOptionGroup">
              <span class="opt-radio-pill" onclick="RubyApp.selectPillOption(this, 'donenessOptionGroup')">🥩 Término Medio (Jugoso)</span>
              <span class="opt-radio-pill selected" onclick="RubyApp.selectPillOption(this, 'donenessOptionGroup')">🔥 Tres Cuartos (Recomendado)</span>
              <span class="opt-radio-pill" onclick="RubyApp.selectPillOption(this, 'donenessOptionGroup')">🤎 Bien Cocida</span>
            </div>
          </div>

          <!-- Opción 3: Adicionales y Extras Gourmet -->
          <div class="modal-opt-section">
            <label class="modal-opt-title">3. Agrega extras irresistibles:</label>
            <label class="modal-checkbox-row">
              <span>🥓 Doble Tocineta Ahumada (+ $1.50)</span>
              <input type="checkbox" class="extra-topping-check" value="1.50" data-name="Extra Tocineta" onchange="RubyApp.recalculateModalTotal()">
            </label>
            <label class="modal-checkbox-row">
              <span>🧀 Queso Cheddar Fundido Extra (+ $1.00)</span>
              <input type="checkbox" class="extra-topping-check" value="1.00" data-name="Extra Cheddar" onchange="RubyApp.recalculateModalTotal()">
            </label>
            <label class="modal-checkbox-row">
              <span>🍳 Huevo Frito a la Plancha (+ $0.80)</span>
              <input type="checkbox" class="extra-topping-check" value="0.80" data-name="Huevo Frito" onchange="RubyApp.recalculateModalTotal()">
            </label>
            <label class="modal-checkbox-row">
              <span>🌶️ Rodajas de Jalapeños (+ $0.60)</span>
              <input type="checkbox" class="extra-topping-check" value="0.60" data-name="Extra Jalapeños" onchange="RubyApp.recalculateModalTotal()">
            </label>
          </div>

          <!-- Opción 4: Eliminación de Ingredientes -->
          <div class="modal-opt-section">
            <label class="modal-opt-title">4. ¿Deseas remover algún ingrediente?</label>
            <label class="modal-checkbox-row">
              <span>🚫 Sin Cebolla</span>
              <input type="checkbox" class="remove-ingredient-check" value="Sin Cebolla">
            </label>
            <label class="modal-checkbox-row">
              <span>🚫 Sin Pepinillos</span>
              <input type="checkbox" class="remove-ingredient-check" value="Sin Pepinillos">
            </label>
          </div>
        ` : `
          <!-- Opciones para Bebidas o Acompañantes -->
          <div class="modal-opt-section">
            <label class="modal-opt-title">Notas especiales:</label>
            <textarea id="modalSpecialNotes" rows="2" placeholder="Ej: Con hielo extra, salsa aparte, etc." style="width: 100%; background: var(--color-card-alt); border: 1px solid var(--color-border); border-radius: 8px; color: #fff; padding: 8px; font-size: 0.8rem;"></textarea>
          </div>
        `}
      `;
    }

    if (modalBackdrop) {
      modalBackdrop.style.display = 'flex';
    }
  },

  /**
   * Cierra el modal de personalización.
   */
  closeProductModal(event) {
    if (event && event.target.id !== 'productModalBackdrop' && !event.target.classList.contains('modal-close-btn')) {
      return;
    }
    const modalBackdrop = document.getElementById('productModalBackdrop');
    if (modalBackdrop) modalBackdrop.style.display = 'none';
    this.state.currentModalProduct = null;
  },

  /**
   * Permite seleccionar una píldora de opción única (Radio button visual).
   */
  selectPillOption(element, groupId) {
    const parent = document.getElementById(groupId);
    if (parent) {
      parent.querySelectorAll('.opt-radio-pill').forEach(pill => pill.classList.remove('selected'));
    }
    element.classList.add('selected');
    this.recalculateModalTotal();
  },

  /**
   * Incrementa la cantidad de unidades en el modal.
   */
  increaseModalQty() {
    this.state.currentModalQty++;
    document.getElementById('modalQtyDisplay').textContent = this.state.currentModalQty;
    this.recalculateModalTotal();
  },

  /**
   * Disminuye la cantidad de unidades en el modal asegurando al menos 1 unidad.
   */
  decreaseModalQty() {
    if (this.state.currentModalQty > 1) {
      this.state.currentModalQty--;
      document.getElementById('modalQtyDisplay').textContent = this.state.currentModalQty;
      this.recalculateModalTotal();
    }
  },

  /**
   * Recalcula el precio total del modal sumando base + extras * cantidad.
   */
  recalculateModalTotal() {
    if (!this.state.currentModalProduct) return;

    let unitPrice = this.state.currentModalProduct.price;

    // Sumar extras seleccionados con checkbox
    const extraChecks = document.querySelectorAll('.extra-topping-check:checked');
    extraChecks.forEach(ch => {
      unitPrice += parseFloat(ch.value || 0);
    });

    // Validar si seleccionó pan sin gluten (+$0.75)
    const selectedBread = document.querySelector('#breadOptionGroup .opt-radio-pill.selected');
    if (selectedBread && selectedBread.textContent.includes('Sin Gluten')) {
      unitPrice += 0.75;
    }

    const total = unitPrice * this.state.currentModalQty;
    const priceDisplay = document.getElementById('modalFinalPrice');
    if (priceDisplay) {
      priceDisplay.textContent = `$${total.toFixed(2)}`;
    }
  },

  /**
   * Confirma la selección del modal y agrega el ítem al carrito de compras.
   */
  confirmModalAddToCart() {
    if (!this.state.currentModalProduct) return;

    const product = this.state.currentModalProduct;
    const qty = this.state.currentModalQty;

    // Recopilar personalizaciones
    const customizations = [];

    // Pan seleccionado
    const breadEl = document.querySelector('#breadOptionGroup .opt-radio-pill.selected');
    if (breadEl) customizations.push(breadEl.textContent.trim());

    // Término seleccionado
    const donenessEl = document.querySelector('#donenessOptionGroup .opt-radio-pill.selected');
    if (donenessEl) customizations.push(donenessEl.textContent.trim());

    // Extras seleccionados
    const extraChecks = document.querySelectorAll('.extra-topping-check:checked');
    let extraCost = 0;
    extraChecks.forEach(ch => {
      customizations.push(`+ ${ch.getAttribute('data-name')}`);
      extraCost += parseFloat(ch.value);
    });

    // Ingredientes removidos
    const removedChecks = document.querySelectorAll('.remove-ingredient-check:checked');
    removedChecks.forEach(ch => {
      customizations.push(ch.value);
    });

    // Notas de bebidas / postres
    const notesEl = document.getElementById('modalSpecialNotes');
    if (notesEl && notesEl.value.trim()) {
      customizations.push(`Nota: ${notesEl.value.trim()}`);
    }

    // Calcular precio unitario con extras
    let unitPrice = product.price + extraCost;
    if (breadEl && breadEl.textContent.includes('Sin Gluten')) {
      unitPrice += 0.75;
    }

    // Crear el elemento de carrito con identificador único
    const cartItem = {
      cartId: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      unitPrice: unitPrice,
      quantity: qty,
      customizations: customizations,
      totalPrice: unitPrice * qty
    };

    // Añadir al arreglo del carrito
    this.state.cart.push(cartItem);

    // Guardar en almacenamiento local
    this.saveStateToStorage();

    // Actualizar badges visuales
    this.updateCartBadges();

    // Cerrar modal
    this.closeProductModal();

    // Mostrar feedback visual Toast
    this.showToast(`¡${product.name} agregado a tu orden!`, '🍔');
  },

  /**
   * Actualiza los contadores numéricos de items en el carrito.
   */
  updateCartBadges() {
    const totalCount = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const headerBadge = document.getElementById('cartCountBadge');
    if (headerBadge) {
      headerBadge.textContent = totalCount;
      headerBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }

    const tabBadge = document.getElementById('tabCartBadge');
    if (tabBadge) {
      tabBadge.textContent = totalCount;
      tabBadge.style.display = totalCount > 0 ? 'flex' : 'none';
    }
  },

  /**
   * Renderiza los elementos del carrito en la pantalla 'Hacer Pedido'.
   */
  renderCart() {
    const listContainer = document.getElementById('cartItemsList');
    if (!listContainer) return;

    if (this.state.cart.length === 0) {
      listContainer.innerHTML = `
        <div class="cart-empty-state">
          <div class="cart-empty-icon">🛒</div>
          <h4>Tu cesta está vacía</h4>
          <p style="font-size: 0.75rem; margin-top: 4px;">Explora el menú y agrega tus hamburguesas favoritas.</p>
          <button onclick="RubyApp.navigateTo('menu')" style="margin-top: 12px; background: var(--color-primary); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer;">Ir al Menú</button>
        </div>
      `;
      this.updateFinancialSummary(0);
      return;
    }

    // Renderizar filas de productos en el carrito
    listContainer.innerHTML = this.state.cart.map(item => `
      <div class="cart-item-row">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          ${item.customizations.length > 0 ? `<div class="cart-item-mods">${item.customizations.join(' • ')}</div>` : ''}
          <div class="cart-item-price">$${(item.unitPrice * item.quantity).toFixed(2)} ($${item.unitPrice.toFixed(2)} c/u)</div>
        </div>
        <div class="cart-item-controls">
          <button class="cart-ctrl-btn" onclick="RubyApp.changeCartItemQty('${item.cartId}', -1)">-</button>
          <span class="cart-ctrl-qty">${item.quantity}</span>
          <button class="cart-ctrl-btn" onclick="RubyApp.changeCartItemQty('${item.cartId}', 1)">+</button>
        </div>
      </div>
    `).join('');

    // Calcular subtotal general
    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    this.updateFinancialSummary(subtotal);
  },

  /**
   * Modifica la cantidad de un ítem en el carrito (+1 o -1).
   */
  changeCartItemQty(cartId, delta) {
    const itemIndex = this.state.cart.findIndex(i => i.cartId === cartId);
    if (itemIndex === -1) return;

    this.state.cart[itemIndex].quantity += delta;

    if (this.state.cart[itemIndex].quantity <= 0) {
      // Eliminar producto si llega a cero
      this.state.cart.splice(itemIndex, 1);
      this.showToast('Producto retirado de la orden', '🗑️');
    }

    this.saveStateToStorage();
    this.updateCartBadges();
    this.renderCart();
  },

  /**
   * Vacía completamente los productos de la cesta.
   */
  clearCart() {
    if (this.state.cart.length === 0) return;
    if (confirm('¿Deseas vaciar todos los productos de tu orden?')) {
      this.state.cart = [];
      this.saveStateToStorage();
      this.updateCartBadges();
      this.renderCart();
      this.showToast('Cesta vaciada', '🧹');
    }
  },

  /**
   * Cambia la modalidad de entrega (Delivery o Pick-up) y recalcula costos.
   */
  setDeliveryMode(mode) {
    this.state.deliveryMode = mode;

    // Actualizar clases activas en los tabs
    const tabDel = document.getElementById('tabDelivery');
    const tabPick = document.getElementById('tabPickup');
    const addressGroup = document.getElementById('addressFieldGroup');
    const addressInput = document.getElementById('custAddress');

    if (mode === 'delivery') {
      tabDel.classList.add('active');
      tabPick.classList.remove('active');
      if (addressGroup) addressGroup.style.display = 'flex';
      if (addressInput) addressInput.required = true;
    } else {
      tabDel.classList.remove('active');
      tabPick.classList.add('active');
      if (addressGroup) addressGroup.style.display = 'none';
      if (addressInput) addressInput.required = false;
    }

    // Refrescar resumen financiero
    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    this.updateFinancialSummary(subtotal);
  },

  /**
   * Actualiza el desglose financiero (Subtotal, Envío, Impuestos, Total).
   */
  updateFinancialSummary(subtotal) {
    const deliveryFee = this.state.deliveryMode === 'delivery' && subtotal > 0 ? this.state.costDelivery : 0.00;
    const tax = subtotal * this.state.taxRate;
    const total = subtotal + deliveryFee + tax;

    const lblSubtotal = document.getElementById('summarySubtotal');
    const lblDelivery = document.getElementById('summaryDeliveryFee');
    const lblTax = document.getElementById('summaryTax');
    const lblTotal = document.getElementById('summaryTotal');

    if (lblSubtotal) lblSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (lblDelivery) lblDelivery.textContent = deliveryFee > 0 ? `$${deliveryFee.toFixed(2)}` : 'Gratis';
    if (lblTax) lblTax.textContent = `$${tax.toFixed(2)}`;
    if (lblTotal) lblTotal.textContent = `$${total.toFixed(2)}`;
  },

  /**
   * Envía y confirma la orden de pedido hacia la cocina de Ruby's.
   */
  submitOrder(event) {
    event.preventDefault();

    if (this.state.cart.length === 0) {
      alert('Tu cesta de compras está vacía. Selecciona al menos un producto del menú.');
      this.navigateTo('menu');
      return;
    }

    const custName = document.getElementById('custName').value.trim();
    const custPhone = document.getElementById('custPhone').value.trim();
    const custAddress = this.state.deliveryMode === 'delivery' 
      ? document.getElementById('custAddress').value.trim() 
      : 'Retiro en Sucursal Principal (Av. de las Brasas #404)';
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('orderNotes').value.trim();

    // Generar código único de orden (Ej: RB-5832)
    const orderCode = 'RB-' + Math.floor(1000 + Math.random() * 9000);

    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const deliveryFee = this.state.deliveryMode === 'delivery' ? this.state.costDelivery : 0;
    const tax = subtotal * this.state.taxRate;
    const grandTotal = subtotal + deliveryFee + tax;

    // Crear el objeto formal de la orden activa
    const newOrder = {
      code: orderCode,
      createdAt: new Date().toISOString(),
      customerName: custName,
      customerPhone: custPhone,
      deliveryAddress: custAddress,
      deliveryType: this.state.deliveryMode,
      paymentMethod: paymentMethod,
      specialNotes: notes,
      items: [...this.state.cart],
      financials: {
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        tax: tax,
        total: grandTotal
      },
      currentStep: 1, // Paso 1: Pedido Recibido
      estimatedMinutesRemaining: 30,
      courier: {
        name: 'Carlos "Ray" Méndez',
        vehicle: 'Moto Honda Cargo Roja • Placa RB-44',
        rating: 4.9,
        phone: '+15559876543'
      }
    };

    // Asignar al estado activo
    this.state.activeOrder = newOrder;

    // Vaciar el carrito tras orden confirmada
    this.state.cart = [];
    this.saveStateToStorage();
    this.updateCartBadges();

    // Notificar al usuario con Toast
    this.showToast(`¡Orden ${orderCode} confirmada con éxito!`, '🚀');

    // Redireccionar automáticamente a la pantalla de seguimiento (Estatus del Pedido)
    this.navigateTo('status');
  },

  // --------------------------------------------------------------------------
  // 7. PROCESO 3: ESTATUS DEL PEDIDO (SEGUIMIENTO EN TIEMPO REAL)
  // --------------------------------------------------------------------------
  /**
   * Configura la orden inicial de muestra para que el usuario pueda probar el estatus de inmediato.
   */
  setupInitialOrder() {
    if (!this.state.activeOrder) {
      // Orden demo predeterminada para que el botón de Estatus funcione desde el primer clic
      this.state.activeOrder = {
        code: 'RB-8420',
        createdAt: new Date().toISOString(),
        customerName: 'Cliente VIP Ruby',
        customerPhone: '+1 555 444 8888',
        deliveryAddress: 'Av. Las Palmeras #502, Apto 3C',
        deliveryType: 'delivery',
        paymentMethod: 'cash',
        specialNotes: 'Tocar el timbre dos veces por favor.',
        items: [
          { name: 'Ruby Monster Double Smash', quantity: 1, unitPrice: 8.99 },
          { name: 'Papas Fritas Trufadas Ruby', quantity: 1, unitPrice: 3.99 },
          { name: 'Malteada Espesa Shake Red Ruby', quantity: 1, unitPrice: 4.25 }
        ],
        financials: {
          subtotal: 17.23,
          deliveryFee: 2.00,
          tax: 1.38,
          total: 20.61
        },
        currentStep: 2, // Paso 2: En la Parrilla
        estimatedMinutesRemaining: 24,
        courier: {
          name: 'Carlos "Ray" Méndez',
          vehicle: 'Moto Honda Cargo Roja • Placa RB-44',
          rating: 4.9,
          phone: '+15559876543'
        }
      };
      this.saveStateToStorage();
    }
  },

  /**
   * Renderiza y actualiza la vista gráfica del estatus del pedido.
   */
  renderOrderStatus() {
    const order = this.state.activeOrder;
    const activeDisplay = document.getElementById('activeOrderDisplay');
    const noOrderMsg = document.getElementById('noOrderMessage');

    if (!order) {
      if (activeDisplay) activeDisplay.style.display = 'none';
      if (noOrderMsg) noOrderMsg.style.display = 'block';
      return;
    }

    if (activeDisplay) activeDisplay.style.display = 'flex';
    if (noOrderMsg) noOrderMsg.style.display = 'none';

    // Textos de estado según la etapa (1 a 4)
    const stateLabels = {
      1: 'Pedido Confirmado',
      2: 'En la Parrilla 🔥',
      3: 'Empacado & Asignado 📦',
      4: order.deliveryType === 'delivery' ? 'En Camino a tu Ubicación 🛵' : '¡Listo para Retirar! 🍔'
    };

    // Actualizar encabezados
    document.getElementById('lblOrderCode').textContent = order.code;
    document.getElementById('lblOrderStateText').textContent = stateLabels[order.currentStep] || 'En Proceso';

    // Configurar temporizador
    this.startOrderCountdown(order.estimatedMinutesRemaining);

    // Actualizar visualmente los 4 pasos del Stepper
    for (let step = 1; step <= 4; step++) {
      const stepEl = document.getElementById(`step${step}`);
      if (!stepEl) continue;

      stepEl.classList.remove('completed', 'current', 'pending');

      if (step < order.currentStep) {
        stepEl.classList.add('completed');
      } else if (step === order.currentStep) {
        stepEl.classList.add('current');
      } else {
        stepEl.classList.add('pending');
      }
    }

    // Datos del repartidor
    if (order.courier) {
      document.getElementById('lblCourierName').textContent = order.courier.name;
    }
  },

  /**
   * Inicia el temporizador de cuenta regresiva regresivo para el estatus.
   */
  startOrderCountdown(minutes) {
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }

    let secondsTotal = (minutes || 24) * 60 + 18;
    const timerDisplay = document.getElementById('lblCountdownTimer');

    const updateLabel = () => {
      const mins = Math.floor(secondsTotal / 60);
      const secs = secondsTotal % 60;
      if (timerDisplay) {
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`;
      }
      if (secondsTotal > 0) {
        secondsTotal--;
      } else {
        clearInterval(this.state.timerInterval);
      }
    };

    updateLabel();
    this.state.timerInterval = setInterval(updateLabel, 1000);
  },

  /**
   * Función interactiva de simulación para avanzar la etapa del pedido (Demo).
   */
  advanceOrderStatusDemo() {
    if (!this.state.activeOrder) {
      this.setupInitialOrder();
    }

    let step = this.state.activeOrder.currentStep;
    step++;
    if (step > 4) {
      step = 1; // Reiniciar ciclo demostrativo
      this.showToast('Ciclo de demostración reiniciado al Paso 1', '🔄');
    } else {
      this.showToast(`Estado avanzado a Etapa ${step}`, '⚡');
    }

    this.state.activeOrder.currentStep = step;
    this.state.activeOrder.estimatedMinutesRemaining = Math.max(5, 30 - (step * 7));
    this.saveStateToStorage();
    this.renderOrderStatus();
  },

  /**
   * Permite consultar un pedido específico por su código RB-XXXX.
   */
  searchOrderByInput() {
    const input = document.getElementById('lookupOrderInput');
    if (!input || !input.value.trim()) {
      alert('Ingresa un número de orden para buscar (Ej: RB-8420)');
      return;
    }

    const code = input.value.trim().toUpperCase();
    if (this.state.activeOrder && this.state.activeOrder.code.toUpperCase() === code) {
      this.renderOrderStatus();
      this.showToast(`Orden ${code} localizada`, '🔍');
    } else {
      alert(`No se encontró una orden activa con el código "${code}". Mostrando orden actual.`);
    }
  },

  // --------------------------------------------------------------------------
  // 8. PROCESO 4: CONTACTO Y UBICACIÓN (ZONA DE SERVICIO Y CANALES)
  // --------------------------------------------------------------------------
  /**
   * Manejador del formulario de contacto y buzón de sugerencias.
   */
  handleContactForm(event) {
    event.preventDefault();
    const name = document.getElementById('contactSenderName').value.trim();
    const email = document.getElementById('contactSenderEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
      alert('Por favor completa todos los campos del formulario.');
      return;
    }

    // Limpiar formulario tras envío
    event.target.reset();

    // Notificación elegante al usuario
    this.showToast(`¡Gracias ${name}! Tu mensaje ha sido enviado a Ruby's.`, '💌');
  },

  // --------------------------------------------------------------------------
  // 9. UTILIDADES DEL SISTEMA (TOASTS, STORAGE, RELOJ)
  // --------------------------------------------------------------------------
  /**
   * Muestra una notificación emergente tipo Toast en la parte superior.
   */
  showToast(message, icon = '🍔') {
    const toast = document.getElementById('toastBox');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');

    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    if (iconEl) iconEl.textContent = icon;

    toast.classList.add('show');

    // Ocultar automáticamente luego de 3 segundos
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  },

  /**
   * Actualiza el reloj ficticio de la barra de estado del dispositivo.
   */
  initClock() {
    const clockEl = document.getElementById('statusClock');
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      if (clockEl) clockEl.textContent = `${hours}:${minutes}`;
    };
    updateTime();
    setInterval(updateTime, 10000);
  },

  /**
   * Guarda el estado actual en el almacenamiento local del navegador.
   */
  saveStateToStorage() {
    try {
      localStorage.setItem('rubys_cart', JSON.stringify(this.state.cart));
      if (this.state.activeOrder) {
        localStorage.setItem('rubys_active_order', JSON.stringify(this.state.activeOrder));
      }
    } catch (e) {
      console.warn('No se pudo persistir en localStorage:', e);
    }
  },

  /**
   * Carga el estado guardado previamente.
   */
  loadStateFromStorage() {
    try {
      const savedCart = localStorage.getItem('rubys_cart');
      if (savedCart) {
        this.state.cart = JSON.parse(savedCart);
      }
      const savedOrder = localStorage.getItem('rubys_active_order');
      if (savedOrder) {
        this.state.activeOrder = JSON.parse(savedOrder);
      }
    } catch (e) {
      console.warn('Error al leer de localStorage:', e);
    }
  },

  /**
   * Registra el Service Worker para funcionamiento como Progressive Web App (PWA).
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Service Worker de Ruby\'s Burger registrado con éxito:', reg.scope))
          .catch(err => console.log('Registro de Service Worker omitido o no compatible en este entorno:', err));
      });
    }
  }
};

// ----------------------------------------------------------------------------
// DISPARADOR DE ARRANQUE TRAS CARGAR EL DOCUMENTO DOM
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  RubyApp.init();
});
