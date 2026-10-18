const permissionStatus = document.getElementById('permission-status');
const btnRequest = document.getElementById('btn-request');
const btnNotify = document.getElementById('btn-notify');
const btnCancel = document.getElementById('btn-cancel');
const swStatus = document.getElementById('sw-status');

// Registrar el Service Worker
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    swStatus.textContent = 'Este navegador no soporta Service Workers';
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    swStatus.textContent = 'Service Worker registrado correctamente';
    console.log('SW registrado:', registration);
    return registration;
  } catch (error) {
    swStatus.textContent = 'Error al registrar el Service Worker: ' + error.message;
    console.error(error);
    return null;
  }
}

// Verificar el estado actual del permiso
function checkPermission() {
  if (!('Notification' in window)) {
    permissionStatus.textContent = 'Este navegador no soporta notificaciones';
    return;
  }

  const state = Notification.permission;
  updatePermissionUI(state);
}

function updatePermissionUI(state) {
  const messages = {
    granted: '✅ Concedido (granted)',
    denied: '❌ Denegado (denied)',
    default: '⚠️ Pendiente (default)'
  };

  permissionStatus.textContent = messages[state] || state;
  permissionStatus.className = state;

  // Habilitar/deshabilitar botones según el permiso
  const hasPermission = state === 'granted';
  btnNotify.disabled = !hasPermission;
  btnCancel.disabled = !hasPermission;
}

// Solicitar permiso
async function requestPermission() {
  if (!('Notification' in window)) {
    alert('Este navegador no soporta notificaciones');
    return;
  }

  const result = await Notification.requestPermission();
  updatePermissionUI(result);
}

// Mostrar notificación
async function showNotification() {
  const registration = await navigator.serviceWorker.ready;
  registration.active.postMessage({
    type: 'SHOW_NOTIFICATION'
  });
}

// Cerrar / cancelar notificaciones
async function cancelNotifications() {
  const registration = await navigator.serviceWorker.ready;
  registration.active.postMessage({
    type: 'CLOSE_NOTIFICATIONS'
  });
}

// Eventos
btnRequest.addEventListener('click', requestPermission);
btnNotify.addEventListener('click', showNotification);
btnCancel.addEventListener('click', cancelNotifications);

// Al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  checkPermission();
  await registerServiceWorker();
});