const CACHE_NAME = "subject-planner-v30";
const STUDENT_VERSION_URL = "https://ants-byte.github.io/enrolment_planner/?mode=student";
const IS_LOCAL_INSTALLATION = ["localhost", "127.0.0.1", "[::1]"].includes(self.location.hostname);
const ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "script.js",
  "manifest.webmanifest",
  "favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "images/timetable.png",
  "images/sas_logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

const getUnavailableInstructions = () => new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#d9f1ff">
  <title>Timetable Planner unavailable</title>
  <style>
    * { box-sizing: border-box; }
    body {
      min-height: 100vh;
      margin: 0;
      padding: 28px;
      display: grid;
      place-items: center;
      font: 17px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif;
      color: #12334d;
      background:
        radial-gradient(circle at 18% 12%, rgba(255,255,255,.92), transparent 34%),
        linear-gradient(145deg, #edf9ff 0%, #cdeeff 52%, #b8e2fa 100%);
    }
    main {
      width: min(720px, 100%);
      padding: clamp(28px, 6vw, 52px);
      border: 1px solid rgba(45, 120, 165, .28);
      border-radius: 22px;
      background: rgba(255, 255, 255, .78);
      box-shadow: 0 20px 55px rgba(34, 96, 133, .2);
      backdrop-filter: blur(8px);
    }
    .brand { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .brand img { width: 72px; height: 72px; border-radius: 16px; box-shadow: 0 8px 20px rgba(25, 91, 135, .18); }
    .site-name { margin: 0; color: #0b3d67; font-size: clamp(1.55rem, 5vw, 2.25rem); line-height: 1.08; }
    h1 { margin: 0 0 12px; color: #164f75; font-size: clamp(1.45rem, 4vw, 2rem); line-height: 1.15; }
    p { margin: 0 0 18px; }
    .instructions { margin: 24px 0; padding: 20px 22px; border-radius: 14px; background: rgba(213, 241, 255, .75); }
    .instructions h2 { margin: 0 0 10px; font-size: 1.08rem; color: #0b4f7d; }
    ol { margin: 0; padding-left: 1.35rem; }
    li + li { margin-top: 7px; }
    code { padding: .12em .4em; border-radius: 5px; background: #fff; color: #0b4f7d; font-weight: 700; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
    a, button {
      border: 1px solid #176fa4;
      border-radius: 9px;
      padding: 11px 17px;
      font: inherit;
      font-weight: 700;
      text-decoration: none;
      color: #fff;
      background: linear-gradient(#2089c8, #126da3);
      cursor: pointer;
    }
    a.secondary { color: #175274; background: rgba(255,255,255,.72); }
    .note { margin-top: 20px; color: #3e637a; font-size: .94rem; }
  </style>
</head>
<body>
  <main>
    <div class="brand">
      <img src="./icons/icon-192.png" alt="Timetable Planner icon">
      <p class="site-name"><strong>Timetable Planner</strong></p>
    </div>
    <h1>${IS_LOCAL_INSTALLATION ? 'The local planner could not be reached' : 'Timetable Planner is offline'}</h1>
    <p>${IS_LOCAL_INSTALLATION
      ? 'The local web server may have stopped, or this device may currently be offline.'
      : 'The student version could not connect. Check this device’s internet connection and try again.'}</p>
    <section class="instructions">
      ${IS_LOCAL_INSTALLATION
        ? `<h2>Start the local staff version</h2>
          <ol>
            <li>Open the Timetable Planner project folder in <strong>VS Code</strong>.</li>
            <li>Select <strong>Go Live</strong> in the VS Code status bar.</li>
            <li>Return here and select <strong>Try again</strong>.</li>
          </ol>`
        : `<h2>Reconnect to the internet</h2>
          <ol>
            <li>Check that Wi-Fi or mobile data is connected.</li>
            <li>If necessary, reconnect to the network.</li>
            <li>Return here and select <strong>Try again</strong>.</li>
          </ol>`}
    </section>
    <div class="actions">
      <button type="button" onclick="location.reload()">Try again</button>
      ${IS_LOCAL_INSTALLATION ? `<a class="secondary" href="${STUDENT_VERSION_URL}">Open student version</a>` : ''}
    </div>
    <p class="note">${IS_LOCAL_INSTALLATION
      ? 'If <strong>Go Live</strong> is not available, install or enable the Live Server extension in VS Code. The student version requires an internet connection.'
      : 'If the connection is working but this message remains, close and reopen Timetable Planner before trying again.'}</p>
  </main>
</body>
</html>`, {
  headers: { "Content-Type": "text/html; charset=utf-8" }
});

const isLocalHost = (url) =>
  url.hostname === "localhost" ||
  url.hostname === "127.0.0.1" ||
  url.hostname === "[::1]";

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (event.request.mode === "navigate" && isLocalHost(url)) {
    event.respondWith(
      fetch(event.request).catch(() => getUnavailableInstructions())
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return caches.match(event.request, { ignoreSearch: true }).then((appShell) =>
          appShell || fetch(event.request).catch(() => getUnavailableInstructions())
        );
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).catch(() => new Response("", { status: 504, statusText: "Offline" }))
    )
  );
});
