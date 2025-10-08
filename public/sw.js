// Install event - activate immediately
self.addEventListener('install', (event) => {
    console.log('[SW] Install event - Android/iOS');
    self.skipWaiting(); // Activate immediately
});

// Activate event - claim all clients
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate event - Android/iOS');
    event.waitUntil(self.clients.claim()); // Take control immediately
});

// Push event - handle background notifications (critical for Android)
self.addEventListener('push', function (event) {
    console.log('[SW] Push event received - Android/iOS', event);

    let data = {};
    try {
        data = event.data ? event.data.json() : {};
        console.log('[SW] Push data:', data);
    } catch (e) {
        console.error('[SW] Error parsing push data:', e);
        data = { title: 'Notification', body: event.data ? event.data.text() : 'You have a new message' };
    }

    const title = data.title || 'DAŠ appka';
    const options = {
        body: data.body || 'Máš novú notifikáciu',
        icon: data.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'default-tag',
        requireInteraction: false,
        data: {
            url: data.url || '/',
            ...data
        }
    };

    console.log('[SW] Showing notification:', title, options);

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => console.log('[SW] Notification shown successfully'))
            .catch(err => console.error('[SW] Error showing notification:', err))
    );
});

// Notification click event - handle when user clicks notification (critical for Android)
self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification click - Android/iOS', event.notification.data);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                console.log('[SW] Found clients:', clientList.length);

                // Check if there's already a window open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        console.log('[SW] Focusing existing window');
                        return client.focus();
                    }
                }

                // No window open, open a new one
                if (self.clients.openWindow) {
                    console.log('[SW] Opening new window:', urlToOpen);
                    return self.clients.openWindow(urlToOpen);
                }
            })
            .catch(err => console.error('[SW] Error handling notification click:', err))
    );
});
