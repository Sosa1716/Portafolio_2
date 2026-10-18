// Service Worker - Ejercicio 3

self.addEventListener('install', (event) => {
    console.log('Service Worker instalado');
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker activado');
    event.waitUntil(self.clients.claim());
  });
  
  // Escuchamos mensajes desde la página
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
      showLocalNotification();
    }
  
    if (event.data && event.data.type === 'CLOSE_NOTIFICATIONS') {
      closeAllNotifications();
    }
  });
  
  // Mostrar notificación local
  function showLocalNotification() {
    const title = '¡Notificación Local!';
  
    const options = {
      body: 'Esta notificación fue disparada desde el Service Worker.',
      icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827349.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/1827/1827349.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'notificacion-local',
      renotify: true,
      data: {
        url: self.location.origin
      }
    };
  
    self.registration.showNotification(title, options);
  }
  
  // Cerrar todas las notificaciones abiertas
  function closeAllNotifications() {
    self.registration.getNotifications().then((notifications) => {
      notifications.forEach((notification) => {
        notification.close();
      });
      console.log('Notificaciones cerradas:', notifications.length);
    });
  }
  
  // Manejar clic en la notificación
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
  
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  });