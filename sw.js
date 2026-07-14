const CACHE_NAME = "subject-planner-v25";
const STUDENT_VERSION_URL = "https://ants-byte.github.io/enrolment_planner/?mode=student";
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

const getLiveServerInstructions = () => new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Local planner unavailable</title>
  <style>
    body { margin: 0; font: 18px/1.5 system-ui, -apple-system, Segoe UI, sans-serif; color: #f7f7f7; background: #262626; }
    main { max-width: 680px; margin: 0 auto; padding: 72px 28px; }
    h1 { margin: 0 0 16px; font-size: clamp(2rem, 6vw, 3.25rem); line-height: 1.08; }
    p, li { max-width: 680px; }
    code { padding: 0.12em 0.35em; border-radius: 4px; background: #3a3a3a; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
    a, button { border: 0; border-radius: 6px; padding: 12px 18px; font: inherit; font-weight: 700; text-decoration: none; color: #fff; background: #0878d1; cursor: pointer; }
    a.secondary, button.secondary { background: #444; }
    details { margin-top: 32px; color: #d5d5d5; }
    summary { cursor: pointer; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>The local planner isn't running</h1>
    <p>You can continue in the student version now, or start the local staff version and try again.</p>
    <div class="actions">
      <a href="${STUDENT_VERSION_URL}">Open student version</a>
      <button class="secondary" type="button" onclick="location.reload()">Try local version again</button>
    </div>
    <details>
      <summary>How to start the local staff version</summary>
      <ol>
        <li>Open this project folder in VS Code.</li>
        <li>Install the <a href="https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer">Live Server extension</a> if needed.</li>
        <li>Right-click <code>index.html</code> and choose <strong>Open with Live Server</strong>.</li>
        <li>Return here and select <strong>Try local version again</strong>.</li>
      </ol>
    </details>
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
      fetch(event.request).catch(() => getLiveServerInstructions())
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).catch(() => new Response("", { status: 504, statusText: "Offline" }))
    )
  );
});
