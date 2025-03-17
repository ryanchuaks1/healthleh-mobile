// sw.js (place in your public/ folder)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Notification', body: 'You have a new message.' };
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || '/icon.png',
  });
});
