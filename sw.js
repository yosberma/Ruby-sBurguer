/**
 * ============================================================================
 * SERVICE WORKER - RUBY'S BURGER MOBILE APP
 * Proporciona soporte offline y almacenamiento en caché para la PWA
 * ============================================================================
 */

// Nombre identificador de la versión de caché actual
const CACHE_NAME = 'rubys-burger-cache-v1';

// Recursos estáticos indispensables para el funcionamiento offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
];

// Evento 'install': Se ejecuta cuando el navegador instala por primera vez el Service Worker
self.addEventListener('install', (event) => {
  // Esperar hasta que se complete la apertura de la caché y el almacenamiento de recursos clave
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precargando recursos estáticos de Ruby\'s Burger...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Evento 'activate': Limpia versiones antiguas de caché para asegurar que el usuario vea la última versión
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Limpiando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento 'fetch': Intercepta solicitudes de red con estrategia Network First / Stale While Revalidate
self.addEventListener('fetch', (event) => {
  // Omitir peticiones de esquemas externos que no sean http/https
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si el recurso ya se encuentra en caché, se entrega de inmediato
      if (cachedResponse) {
        // En paralelo se intenta refrescar desde la red
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {
          // Si no hay red, la versión en caché responde limpiamente
        });
        return cachedResponse;
      }

      // Si no estaba en caché, se solicita a la red
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch((err) => {
        console.warn('[Service Worker] Fallo de conexión de red para:', event.request.url);
      });
    })
  );
});
