const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const btnStart = document.getElementById('btn-start');
const btnCapture = document.getElementById('btn-capture');
const btnStop = document.getElementById('btn-stop');
const status = document.getElementById('status');

let stream = null;

// Activar la cámara
async function startCamera() {
  try {
    // Pedimos acceso a la cámara (video)
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user', // 'user' = frontal | 'environment' = trasera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    // Mostramos el stream en el elemento <video>
    video.srcObject = stream;

    btnStart.disabled = true;
    btnCapture.disabled = false;
    btnStop.disabled = false;
    status.textContent = 'Cámara activada. Puedes tomar una foto.';
  } catch (error) {
    console.error('Error al acceder a la cámara:', error);
    
    if (error.name === 'NotAllowedError') {
      status.textContent = 'Permiso denegado. Debes permitir el acceso a la cámara.';
    } else if (error.name === 'NotFoundError') {
      status.textContent = 'No se encontró ninguna cámara en este dispositivo.';
    } else {
      status.textContent = 'Error: ' + error.message;
    }
  }
}

// Tomar foto y dibujarla en el canvas
function capturePhoto() {
  if (!stream) return;

  const context = canvas.getContext('2d');

  // Ajustamos el tamaño del canvas al del video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Dibujamos el frame actual del video en el canvas
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  status.textContent = '¡Foto capturada!';
}

// Detener la cámara
function stopCamera() {
  if (stream) {
    // Detenemos todas las pistas (tracks) del stream
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
  }

  btnStart.disabled = false;
  btnCapture.disabled = true;
  btnStop.disabled = true;
  status.textContent = 'Cámara detenida.';
}

// Eventos
btnStart.addEventListener('click', startCamera);
btnCapture.addEventListener('click', capturePhoto);
btnStop.addEventListener('click', stopCamera);