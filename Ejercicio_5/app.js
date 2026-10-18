const API_URL = 'https://jsonplaceholder.typicode.com/users';
const DB_NAME = 'CacheAPI_DB';
const DB_VERSION = 1;
const STORE_NAME = 'api_cache';

let db = null;

// ======================
// INDEXEDDB
// ======================
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => reject(event.target.error);
  });
}

// Guardar datos en IndexedDB
function saveToCache(data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Limpiamos y guardamos todo como un solo registro
    store.clear();
    const request = store.put({
      id: 'users',
      data: data,
      timestamp: Date.now()
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Leer datos desde IndexedDB
function getFromCache() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('users');

    request.onsuccess = () => {
      resolve(request.result ? request.result.data : null);
    };
    request.onerror = () => reject(request.error);
  });
}

// ======================
// ESTRATEGIA NETWORK-FIRST
// ======================
async function fetchWithNetworkFirst() {
  const sourceEl = document.getElementById('data-source');
  const loadingEl = document.getElementById('loading');

  loadingEl.classList.remove('hidden');

  try {
    // 1. Intentamos la red primero
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error('Respuesta de red no válida');
    }

    const data = await response.json();

    // 2. Guardamos copia en IndexedDB
    await saveToCache(data);

    sourceEl.textContent = 'Red (Network)';
    sourceEl.className = 'network';

    return data;

  } catch (error) {
    console.warn('Fallo de red, intentando IndexedDB...', error);

    // 3. Fallback: leemos de IndexedDB
    const cachedData = await getFromCache();

    if (cachedData) {
      sourceEl.textContent = 'Caché local (IndexedDB)';
      sourceEl.className = 'cache';
      return cachedData;
    }

    // Si no hay nada en caché tampoco
    sourceEl.textContent = 'Sin datos disponibles';
    sourceEl.className = '';
    throw new Error('No hay conexión ni datos en caché');
  } finally {
    loadingEl.classList.add('hidden');
  }
}

// ======================
// UI
// ======================
const lista = document.getElementById('lista');
const emptyMsg = document.getElementById('empty-msg');
const btnLoad = document.getElementById('btn-load');
const networkStatus = document.getElementById('network-status');

function renderUsers(users) {
  lista.innerHTML = '';

  if (!users || users.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }

  emptyMsg.classList.add('hidden');

  users.forEach((user) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${user.name}</strong>
      <span>${user.email} · ${user.company?.name || ''}</span>
    `;
    lista.appendChild(li);
  });
}

// Detectar estado de red
function updateNetworkStatus() {
  if (navigator.onLine) {
    networkStatus.textContent = 'En línea';
    networkStatus.className = 'online';
  } else {
    networkStatus.textContent = 'Sin conexión';
    networkStatus.className = 'offline';
  }
}

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// Botón cargar
btnLoad.addEventListener('click', async () => {
  try {
    const data = await fetchWithNetworkFirst();
    renderUsers(data);
  } catch (error) {
    emptyMsg.textContent = error.message;
    emptyMsg.classList.remove('hidden');
    lista.innerHTML = '';
  }
});

// ======================
// INICIALIZACIÓN
// ======================
document.addEventListener('DOMContentLoaded', async () => {
  updateNetworkStatus();

  try {
    await openDatabase();

    // Al iniciar, intentamos mostrar lo que haya en caché (si existe)
    const cached = await getFromCache();
    if (cached) {
      document.getElementById('data-source').textContent = 'Caché local (IndexedDB)';
      document.getElementById('data-source').className = 'cache';
      renderUsers(cached);
    }
  } catch (error) {
    console.error('Error al iniciar IndexedDB:', error);
  }
});