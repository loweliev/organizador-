self.addEventListener('install', (event) => {
  console.log('📦 Service Worker instalado');
  self.skipWaiting(); // fuerza la activación inmediata
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activado');
});

self.addEventListener('fetch', (event) => {
  // Esto es necesario para que el SW responda y sea considerado válido
  event.respondWith(fetch(event.request));
});
