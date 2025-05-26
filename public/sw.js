self.addEventListener('push', function (event) {
    const data = event.data?.json() || {};
    event.waitUntil(
       self.registration.showNotification(data.title || 'Default Title', {
           body: data.body || 'Default message body',
           icon: '/premeny-logo.png',
       })
    );
});
