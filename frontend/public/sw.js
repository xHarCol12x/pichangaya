// PichangaLibre Service Worker — Web Push handler
self.addEventListener('push', function (event) {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch {
        data = { title: 'PichangaLibre', body: event.data.text() };
    }

    const title = data.title || 'PichangaLibre';
    const options = {
        body: data.body || '',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        data: { url: data.url || '/dashboard/bookings' },
        vibrate: [200, 100, 200],
        tag: 'pichangalibre-notification',
        renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const url = event.notification.data?.url || '/dashboard/bookings';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        }),
    );
});
