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

  const CUSTOM_UA = 'MyTestAgent/1.0';

  // ── Set userAgent at context creation (the correct public API) ────────────────
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    userAgent: CUSTOM_UA,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
    headless: false,
  });

  console.log(`✅ Context launched with userAgent: '${CUSTOM_UA}'`);

  // ── Wait for the extension service worker ────────────────────────────────────
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker');
  console.log('✅ Service worker registered:', sw.url());

  // ── Ask the SW to fetch and return its User-Agent header ──────────────────────
  const uaSentBySW = await sw.evaluate(async (url) => {
    const res = await fetch(url);
    const headers = await res.json();
    return headers['user-agent'];
  }, echoUrl);

  // ── Also verify a regular page DOES get the override correctly ────────────────
  const page = await context.newPage();
  const uaSentByPage = await page.evaluate(async (url) => {
    const res = await fetch(url);
    const headers = await res.json();
    return headers['user-agent'];
  }, echoUrl);
  await page.close();

  console.log('\n─── Result ─────────────────────────────────────────────────');
  console.log('UA set on context         :', CUSTOM_UA);
  console.log('UA sent by regular page   :', uaSentByPage, uaSentByPage === CUSTOM_UA ? '✅' : '❌');
  console.log('UA sent by service worker :', uaSentBySW,   uaSentBySW  === CUSTOM_UA ? '✅' : '❌ (bug)');

  await context.close();
  server.close();
})();
