const DB_NAME = 'PortafolioDB';
const DB_VERSION = 1;
const STORE_NAME = 'usuarios';

let db = null;

// ======================
// ABRIR / CREAR LA BASE DE DATOS
// ======================
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Se ejecuta solo la primera vez o cuando se sube la versión
    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Creamos el Object Store si no existe
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });

        // Índices opcionales para búsquedas
        store.createIndex('nombre', 'nombre', { unique: false });
        store.createIndex('email', 'email', { unique: true });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('Base de datos abierta correctamente');
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('Error al abrir IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

// ======================
// INSERTAR un registro
// ======================
function addUser(user) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(user);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ======================
// CONSULTAR todos los registros
// ======================
function getAllUsers() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ======================
// ELIMINAR un registro por id
// ======================
function deleteUser(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ======================
// INTERFAZ (UI)
// ======================
const form = document.getElementById('form-add');
const lista = document.getElementById('lista');
const emptyMsg = document.getElementById('empty-msg');
const btnRefresh = document.getElementById('btn-refresh');

// Mostrar los registros en la lista
async function renderUsers() {
  try {
    const users = await getAllUsers();

    lista.innerHTML = '';

    if (users.length === 0) {
      emptyMsg.classList.remove('hidden');
      return;
    }

    emptyMsg.classList.add('hidden');

    users.forEach((user) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="info">
          <strong>${user.nombre}</strong>
          <span>${user.email} · ${user.edad} años</span>
        </div>
        <button data-id="${user.id}">Eliminar</button>
      `;
      lista.appendChild(li);
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
  }
}

// Evento: agregar usuario
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = {
    nombre: document.getElementById('nombre').value.trim(),
    email: document.getElementById('email').value.trim(),
    edad: Number(document.getElementById('edad').value)
  };

  try {
    await addUser(user);
    form.reset();
    await renderUsers();
  } catch (error) {
    if (error.name === 'ConstraintError') {
      alert('Ese correo ya está registrado');
    } else {
      alert('Error al guardar: ' + error.message);
    }
  }
});

// Evento: eliminar usuario (delegación)
lista.addEventListener('click', async (e) => {
  if (e.target.tagName === 'BUTTON') {
    const id = Number(e.target.dataset.id);
    if (confirm('¿Seguro que quieres eliminar este registro?')) {
      await deleteUser(id);
      await renderUsers();
    }
  }
});

// Botón actualizar
btnRefresh.addEventListener('click', renderUsers);

// ======================
// INICIALIZACIÓN
// ======================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await openDatabase();
    await renderUsers();
  } catch (error) {
    alert('No se pudo abrir la base de datos');
  }
});