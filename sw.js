// Service Worker — Mundial 2026 ProyectoVision
// Estrategia: network-first (siempre busca lo más nuevo; si no hay internet, usa caché)
const CACHE = 'mundial2026-v1';
const ESENCIALES = [
  './',
  './index.html',
  './manifest.json'
];

// Instalación: guardar lo esencial
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ESENCIALES)).catch(()=>{})
  );
  self.skipWaiting();
});

// Activación: limpiar cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: red primero, caché de respaldo
self.addEventListener('fetch', e => {
  // No interceptar peticiones a Firebase ni APIs (deben ir siempre a la red)
  const url = e.request.url;
  if (url.includes('firestore') || url.includes('firebase') ||
      url.includes('api-sports') || url.includes('googleapis') ||
      e.request.method !== 'GET') {
    return; // dejar pasar normal
  }
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Guardar copia fresca en caché
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(()=>{});
        return resp;
      })
      .catch(() => caches.match(e.request)) // sin internet → usar caché
  );
});
