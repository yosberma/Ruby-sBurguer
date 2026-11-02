# 🍔 Ruby's Burger - Aplicación Móvil Oficial

Aplicación móvil desarrollada con una arquitectura basada en **procesos operacionales y fichas técnicas**, diseñada para el negocio de comida rápida **Ruby's Burger**. Proporciona una experiencia de usuario rápida, fluida y con diseño *Mobile-First*, accesible desde cualquier navegador web y preparada para su instalación como Aplicación Web Progresiva (**PWA**).

---

## 📱 Estructura Operativa: Los 4 Procesos Principales

La interfaz de inicio de la aplicación implementa 4 botones centrales de acción directa:

1. **Botón 1: Ver Menú** (`#btnMenuPrincipal`): Despliegue del catálogo completo de productos con filtros dinámicos por categorías (Hamburguesas, Acompañantes, Bebidas y Postres) y buscador predictivo en tiempo real.
2. **Botón 2: Hacer Pedido** (`#btnHacerPedido`): Flujo interactivo de compra que incluye modal de personalización gastronómica (tipo de pan, término de cocción, adicionales gourmet, eliminación de ingredientes), cesta de compras, selector de entrega (*Delivery* o *Pick-up*) y cálculo automático de subtotales, impuestos y envíos.
3. **Botón 3: Estatus del Pedido** (`#btnEstatusPedido`): Sistema de rastreo y monitoreo en tiempo real con *Stepper* visual de 4 etapas operativas (Pedido Recibido, En la Parrilla, Empacado y En Camino/Entregado), cronómetro de cuenta regresiva, ficha del repartidor y simulador interactivo de cambios de estado.
4. **Botón 4: Contacto y Ubicación** (`#btnContactoUbicacion`): Visualización de la sucursal central con radar de cobertura geolocalizada (8 km), tabla de horarios de atención, accesos directos a WhatsApp, llamada telefónica y formulario de mensajería.

---

## 🛠️ Tecnologías y Estándares Aplicados

* **HTML5 Semántico**: Elementos estructurados, metadatos móviles (`viewport`, `theme-color`), accesibilidad auditiva e inputs nativos.
* **CSS3 Moderno**: Variables CSS para diseño de identidad corporativa (Rojo Ruby `#D90429`, Carbón `#12131C` y Amarillo Mostaza `#FFB703`), simulador de marco de smartphone responsivo, animaciones `keyframe` y diseño *Mobile-First*.
* **JavaScript ES6+**: Arquitectura en objeto modular (`RubyApp`), reactividad mediante manipulación directa del DOM, persistencia de datos con `localStorage`, temporizadores `setInterval` y gestión de estados.
* **PWA (Progressive Web App)**: Archivo de manifiesto (`manifest.json`) y Service Worker (`sw.js`) con estrategia de almacenamiento en caché para compatibilidad fuera de línea.
* **Comentarios Exhaustivos en Español**: Cada función, variable y bloque clave está documentado detalladamente para facilitar el mantenimiento y la escalabilidad del sistema.

---

## 🚀 Guía de Ejecución

Para iniciar la aplicación en cualquier computadora o teléfono:

1. Haz doble clic en el archivo `index.html` para abrirlo directamente en tu navegador web preferido (Google Chrome, Edge, Safari, Firefox).
2. Para probar la visualización responsiva móvil en una computadora, presiona `F12` en Google Chrome y activa el modo dispositivo (icono de smartphone/tablet).
3. Para instalarla en tu teléfono móvil, despliega el proyecto en un servidor local o remoto y presiona **"Agregar a la pantalla principal"** desde el navegador del dispositivo.

---

## 📂 Estructura de Archivos del Proyecto

```text
App_RubyBurguer/
├── index.html        # Estructura semántica de pantallas, botones de procesos y modales
├── styles.css        # Hoja de estilos con diseño Mobile-First y paleta Ruby's
├── app.js            # Lógica completa de negocio, controladores y persistencia
├── manifest.json     # Manifiesto de Aplicación Web Progresiva (PWA)
├── sw.js             # Service Worker para ejecución y caché offline
└── README.md         # Documentación técnica y guía de usuario
```
