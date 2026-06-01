const { chromium } = require('playwright');
const path = require('path');
const http = require('http');

// ─── Tiny echo server that returns all request headers as JSON ────────────────
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(req.headers));
});

(async () => {
  await new Promise(resolve => server.listen(0, resolve));
  const { port } = server.address();
  const echoUrl = `http://localhost:${port}`;

  const pathToExtension = path.join(__dirname, 'my-extension');

  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
    headless: false, // extensions require non-headless OR chromium channel
  });

  // ── Wait for the extension service worker ────────────────────────────────────
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');
  console.log('✅ Service worker registered:', sw.url());

  // ── Apply user-agent override ─────────────────────────────────────────────────
  const CUSTOM_UA = 'MyTestAgent/1.0';
  await context.setUserAgent(CUSTOM_UA);
  console.log(`✅ setUserAgent('${CUSTOM_UA}') called`);

  // ── Ask the SW to fetch and return its User-Agent header ──────────────────────
  const uaSentBySW = await sw.evaluate(async (url) => {
    const res = await fetch(url);
    const headers = await res.json();
    return headers['user-agent'];
  }, echoUrl);

  console.log('\n─── Result ───────────────────────────────────');
  console.log('UA sent by service worker :', uaSentBySW);
  console.log('Expected                  :', CUSTOM_UA);
  console.log('Match?                    :', uaSentBySW === CUSTOM_UA ? '✅ YES' : '❌ NO (bug)');

  await context.close();
  server.close();
})();
