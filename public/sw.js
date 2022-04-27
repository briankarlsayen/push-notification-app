self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  
  const { title, body } = event.data.json();

  const options = {
    body: body
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

//run when notif is clicked
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    //open website
    clients.openWindow('https://www.google.com/')
  );
});