/* QA: responsive + console + network + interaction audit (temporary, removed after run) */
import { createRequire } from "module";
import fs from "fs";

const BASE = "http://localhost:3000";
const CANDIDATES = [
  "C:/Users/MohamadHossein/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/x.js",
  "C:/Users/MohamadHossein/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/x.js",
];
let chromium = null;
for (const c of CANDIDATES) {
  try { ({ chromium } = createRequire(c)("playwright")); break; } catch {}
}
if (!chromium) { console.log("FATAL: playwright not found in npx cache"); process.exit(2); }

const WIDTHS = [320, 360, 375, 390, 414, 430, 600, 768, 1024, 1280, 1440, 1920];
const HEIGHT = 900;
const SHOT_DIR = "qa-screenshots";
const SHOT_WIDTHS = new Set([360, 768, 1440]);
const SHOT_ROUTES = new Set(["/", "/catalog"]);

// discover one published vehicle id
let vehicleId = null;
try {
  const html = await (await fetch(BASE + "/catalog")).text();
  const m = html.match(/\/catalog\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (m) vehicleId = m[1];
} catch {}
console.log("VEHICLE_ID", vehicleId ?? "none");

const PUBLIC_ROUTES = ["/", "/catalog", "/about", "/contact", "/catalog?search=RAV4", "/catalog?page=2", "/admin/login",
  ...(vehicleId ? [`/catalog/${vehicleId}`] : [])];
const ADMIN_ROUTES = ["/admin", "/admin/vehicles", "/admin/requests", "/admin/settings", "/admin/fees", "/admin/exchange-rate"];
const ADMIN_WIDTHS = [360, 768, 1440];

// auth cookie for admin routes
let sessionCookie = null;
if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
  const r = await fetch(BASE + "/api/admin/login", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }),
  });
  const sc = r.headers.get("set-cookie") || "";
  const mm = sc.match(/admin_session=([^;]+)/);
  if (mm) sessionCookie = mm[1];
}
console.log("ADMIN_SESSION", sessionCookie ? "yes" : "no");

async function launch() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) { console.log("launch fallback chrome:", String(e).slice(0, 120)); return await chromium.launch({ headless: true, channel: "chrome" }); }
}

const browser = await launch();
fs.mkdirSync(SHOT_DIR, { recursive: true });
const overflow = [], navfail = [], consoleErrs = [], http5xx = [], interactFail = [];
let pages = 0;

try {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: HEIGHT } });
    if (sessionCookie) await ctx.addCookies([{ name: "admin_session", value: sessionCookie, domain: "localhost", path: "/" }]);
    const page = await ctx.newPage();
    const errs = [];
    page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().replace(/\s+/g, " ").slice(0, 180)); });
    page.on("pageerror", (e) => errs.push("PAGEERROR: " + String(e).replace(/\s+/g, " ").slice(0, 180)));
    page.on("response", (r) => { if (r.status() >= 500) http5xx.push(`${r.status()} ${r.url()}`); });

    const routes = [...PUBLIC_ROUTES, ...(ADMIN_WIDTHS.includes(w) && sessionCookie ? ADMIN_ROUTES : [])];
    for (const route of routes) {
      try {
        await page.goto(BASE + route, { waitUntil: "load", timeout: 40000 });
        await page.waitForTimeout(700);
        pages++;
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
        if (m.sw > m.iw + 1) {
          const off = await page.evaluate(() => {
            const bad = [];
            for (const el of document.querySelectorAll("body *")) {
              const r = el.getBoundingClientRect();
              if (r.width > 0 && (r.right > window.innerWidth + 2 || r.left < -2)) {
                bad.push(el.tagName + "." + String(el.className?.baseVal ?? el.className ?? "").slice(0, 70));
                if (bad.length >= 6) break;
              }
            }
            return bad;
          });
          overflow.push({ w, route, sw: m.sw, iw: m.iw, off });
          console.log(`OVERFLOW w=${w} ${route} sw=${m.sw} iw=${m.iw} :: ${off.join(" | ")}`);
        }
        if (SHOT_WIDTHS.has(w) && SHOT_ROUTES.has(route)) {
          const name = `${route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home"}-${w}.png`;
          await page.screenshot({ path: `${SHOT_DIR}/${name}` });
        }

        // interaction checks at the two ends
        if (w === 360 || w === 1440) {
          if (route === "/catalog") {
            const toggle = page.locator('button[aria-expanded]').first();
            if (await toggle.count()) {
              await toggle.click({ timeout: 5000 }).catch(() => {});
              await page.waitForTimeout(600);
              const advanced = await page.locator('select[aria-label="گیربکس"]').first().isVisible().catch(() => false);
              if (!advanced) interactFail.push(`w=${w} ${route}: advanced filters did not open`);
              await toggle.click({ timeout: 5000 }).catch(() => {});
              await page.waitForTimeout(400);
            }
          }
          if (route === "/admin/login") {
            const u = page.locator('input').first();
            if (await u.count()) {
              const pwd = page.locator('input[type="password"]');
              if (await pwd.count()) {
                await u.fill(process.env.ADMIN_USERNAME || "");
                await pwd.fill(process.env.ADMIN_PASSWORD || "");
                await page.locator('button[type="submit"]').first().click({ timeout: 5000 }).catch(() => {});
                await page.waitForTimeout(1500);
                const url = page.url();
                if (url.includes("/admin/login")) interactFail.push(`w=${w} admin login did not redirect (url=${url})`);
              }
            }
          }
          if (route.startsWith("/catalog/") && vehicleId) {
            const next = page.locator('button[aria-label="تصویر بعدی"]').first();
            if (await next.count() && await next.isVisible().catch(() => false)) {
              await next.click({ timeout: 5000 }).catch((e) => interactFail.push(`w=${w} gallery next click failed: ${String(e).slice(0, 80)}`));
              await page.waitForTimeout(400);
            }
            const zoom = page.locator('button[aria-label="بزرگ‌نمایی"]').first();
            if (await zoom.count() && await zoom.isVisible().catch(() => false)) {
              await zoom.click({ timeout: 5000 }).catch(() => {});
              await page.waitForTimeout(600);
              const modalOpen = await page.locator('[role="dialog"]').first().isVisible().catch(() => false);
              if (!modalOpen) interactFail.push(`w=${w} gallery zoom modal did not open`);
              await page.keyboard.press("Escape").catch(() => {});
              const closeBtn = page.locator('[role="dialog"] button').first();
              if (await closeBtn.count()) await closeBtn.click({ timeout: 3000 }).catch(() => {});
              await page.waitForTimeout(400);
            }
          }
          if (w === 360 && !route.startsWith("/admin")) {
            const burger = page.locator('button[aria-label="باز کردن منو"]').first();
            if (await burger.count() && await burger.isVisible().catch(() => false)) {
              await burger.click({ timeout: 5000 }).catch(() => {});
              await page.waitForTimeout(700);
              const aside = await page.locator("aside").first().isVisible().catch(() => false);
              if (!aside) interactFail.push(`w=${w} ${route}: mobile menu did not open`);
              const close = page.locator('button[aria-label="بستن منو"]').first();
              if (await close.count()) await close.click({ timeout: 3000 }).catch(() => {});
              await page.waitForTimeout(500);
            }
          }
        }
      } catch (e) {
        navfail.push({ w, route, e: String(e).replace(/\s+/g, " ").slice(0, 140) });
        console.log(`NAVFAIL w=${w} ${route}: ${String(e).replace(/\s+/g, " ").slice(0, 140)}`);
      }
    }
    if (errs.length) {
      const uniq = [...new Set(errs)].slice(0, 6);
      console.log(`CONSOLE w=${w}: ${JSON.stringify(uniq)}`);
      for (const e of uniq) consoleErrs.push(`w=${w} ${e}`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}

console.log("=== SUMMARY ===");
console.log("pages_checked", pages);
console.log("overflow_count", overflow.length);
console.log("navfail_count", navfail.length);
console.log("console_error_count", consoleErrs.length);
console.log("http5xx_count", [...new Set(http5xx)].length);
console.log("interaction_failures", interactFail.length);
if (consoleErrs.length) console.log("CONSOLE_UNIQUE:", JSON.stringify([...new Set(consoleErrs)].slice(0, 10)));
if (http5xx.length) console.log("HTTP5XX:", JSON.stringify([...new Set(http5xx)].slice(0, 10)));
if (interactFail.length) console.log("INTERACT_FAIL:", JSON.stringify(interactFail));
if (navfail.length) console.log("NAVFAIL:", JSON.stringify(navfail));
if (overflow.length) console.log("OVERFLOW:", JSON.stringify(overflow.slice(0, 15)));
process.exit(0);