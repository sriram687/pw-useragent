# pw-sw-useragent-repro

Minimal reproduction for a Playwright bug:

> **`browserContext.setUserAgent()` silently has no effect on existing Chromium service workers.**

---

## Bug

Calling `browserContext.setUserAgent('MyTestAgent/1.0')` after a service worker has registered does **not** update the UA used by that worker's `fetch()` calls. The override is silently dropped — no error, no warning.

**Playwright issue:** *(link here once filed)*  
**Affected file:** `packages/playwright-core/src/server/chromium/crBrowser.ts`

---

## Reproduce

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Run the repro

```bash
node repro.js
```

### 3. Expected output

```
✅ Service worker registered: chrome-extension://<id>/background.js
✅ setUserAgent('MyTestAgent/1.0') called

─── Result ───────────────────────────────────
UA sent by service worker : MyTestAgent/1.0
Expected                  : MyTestAgent/1.0
Match?                    : ✅ YES
```

### 4. Actual output (on affected versions)

```
✅ Service worker registered: chrome-extension://<id>/background.js
✅ setUserAgent('MyTestAgent/1.0') called

─── Result ───────────────────────────────────
UA sent by service worker : Mozilla/5.0 (X11; Linux x86_64) ... (browser default)
Expected                  : MyTestAgent/1.0
Match?                    : ❌ NO (bug)
```

---

## Project Structure

```
pw-sw-useragent-repro/
├── my-extension/
│   ├── manifest.json     ← minimal MV3 extension
│   └── background.js     ← service worker
├── repro.js              ← self-contained repro (includes echo server)
├── package.json
└── README.md
```

---

## Environment

- **Playwright:** 1.x (latest)
- **Browser:** Chromium (persistent context, extension mode)
- **OS:** Linux / macOS / Windows
