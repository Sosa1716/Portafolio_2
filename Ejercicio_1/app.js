// Elementos del DOM
const permissionStatusEl = document.getElementById('permission-status');
const btnCheckPermission = document.getElementById('btn-check-permission');
const btnGetLocation = document.getElementById('btn-get-location');
const locationInfo = document.getElementById('location-info');
const latEl = document.getElementById('lat');
const lngEl = document.getElementById('lng');
const accuracyEl = document.getElementById('accuracy');

// Mapa (Leaflet)
let map = null;
let marker = null;

// Inicializar mapa vacío
function initMap() {
  map = L.map('map').setView([20, 0], 2); // Vista mundial por defecto

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
}

// 1. Consultar estado del permiso con Permissions API
async function checkPermission() {
  // Verificar si el navegador soporta Permissions API
  if (!navigator.permissions) {
    permissionStatusEl.textContent = 'Tu navegador no soporta la Permissions API';
    permissionStatusEl.className = '';
    return;
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });

    // Mostrar el estado
    updatePermissionUI(result.state);

    // Escuchar cambios en el permiso (por si el usuario lo cambia en la configuración)
    result.onchange = () => {
      updatePermissionUI(result.state);
    };

  } catch (error) {
    permissionStatusEl.textContent = 'Error al consultar el permiso: ' + error.message;
    permissionStatusEl.className = '';
  }
}

function updatePermissionUI(state) {
  const messages = {
    granted: '✅ Concedido (granted)',
    denied: '❌ Denegado (denied)',
    prompt: '⚠️ Pendiente de pedir (prompt)'
  };

  permissionStatusEl.textContent = messages[state] || state;
  permissionStatusEl.className = state; // aplica clase granted / denied / prompt
}

// 2. Solicitar ubicación
function getLocation() {
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta la Geolocalización');
    return;
  }

  btnGetLocation.disabled = true;
  btnGetLocation.textContent = 'Obteniendo ubicación...';

  const options = {
    enableHighAccuracy: true,  // Intentar máxima precisión
    timeout: 10000,            // 10 segundos máximo
    maximumAge: 0              // No usar caché de ubicación anterior
  };

  navigator.geolocation.getCurrentPosition(
    // Éxito
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // Mostrar datos
      latEl.textContent = latitude.toFixed(6);
      lngEl.textContent = longitude.toFixed(6);
      accuracyEl.textContent = Math.round(accuracy);
      locationInfo.classList.remove('hidden');

      // Actualizar mapa
      updateMap(latitude, longitude);

      btnGetLocation.disabled = false;
      btnGetLocation.textContent = 'Solicitar ubicación';
    },
    // Error
    (error) => {
      let message = 'Error desconocido';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Permiso denegado por el usuario';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Ubicación no disponible';
          break;
        case error.TIMEOUT:
          message = 'Tiempo de espera agotado';
          break;
      }
      alert(message);
      btnGetLocation.disabled = false;
      btnGetLocation.textContent = 'Solicitar ubicación';
    },
    options
  );
}

// Actualizar el mapa con la posición
function updateMap(lat, lng) {
  if (!map) return;

  // Centrar el mapa
  map.setView([lat, lng], 15);

  // Si ya hay un marcador, lo movemos; si no, lo creamos
  if (marker) {
    marker.setLatLng([lat, lng]);
  } else {
    marker = L.marker([lat, lng]).addTo(map)
      .bindPopup(`Tu ubicación<br>Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`)
      .openPopup();
  }
}

// Eventos
btnCheckPermission.addEventListener('click', checkPermission);
btnGetLocation.addEventListener('click', getLocation);

// Al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  checkPermission(); // Consultamos el permiso automáticamente
});