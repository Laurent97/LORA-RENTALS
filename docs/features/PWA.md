# PWA verification matrix

Run `npm run verify:pwa` and `npm run build` before deploying. Native installation must then be checked from a production HTTPS URL because browsers intentionally suppress install prompts on ordinary HTTP origins.

| Device / browser | Expected result |
| --- | --- |
| Android Chrome | Branded sheet after 20 seconds or 50% scroll; Install invokes the native dialog. |
| Android Samsung Internet | Sheet appears only when browser supplies `beforeinstallprompt`. |
| iPhone/iPad Safari | Three-step Add to Home Screen guide; no native dialog is attempted. |
| iOS Chrome/Firefox/Edge | Safari guidance is shown. |
| Desktop Chrome/Edge | Small top-right card when `beforeinstallprompt` is available. |
| Desktop Firefox/Safari | No install UI. |
| Installed app | No install UI; optional notification-reminder request is available after launch. |
| WebView, data saver, slow-2G | No install UI. |

Use Chrome DevTools Application panel to verify the manifest, service worker, icon sizes, and offline fallback. Run Lighthouse's Progressive Web App audit against the deployed domain after the service worker has activated.
