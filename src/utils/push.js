import api from './api';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPush(userId) {
  if (!publicVapidKey) {
      console.error('VAPID Public Key not found in environment');
      return;
  }
  console.log('Registering Push with VAPID Key:', publicVapidKey.substring(0, 10) + '...'); // Log partial key for verification

  if ('serviceWorker' in navigator) {
    try {
      const register = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await register.pushManager.getSubscription();

      if (!subscription) {
        subscription = await register.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      // Send subscription to backend
      await api.post('/push/subscribe', {
        userId,
        subscription
      });

      console.log('Push Registered...');
    } catch (err) {
      console.error('Error registering push:', err);
    }
  }
}
