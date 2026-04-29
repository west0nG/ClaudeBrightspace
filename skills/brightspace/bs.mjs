#!/usr/bin/env node
// Brightspace skill core: persistent-session D2L Valence API client.
// One-line subcommands; all query output is JSON on stdout, logs on stderr.

import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = `${SKILL_DIR}/.userdata`;
const STATE_FILE = `${STATE_DIR}/storageState.json`;
const HOME_URL = 'https://brightspace.usc.edu/d2l/home';
const LOGIN_HOST = 'login.usc.edu';

const log = (...a) => console.error('[bs]', ...a);
const out = (obj) => console.log(JSON.stringify(obj));

// Use a non-persistent browser + an explicit storageState JSON file. This
// captures BOTH long-lived cookies and session cookies (those without an
// Expires field), which Chrome's user-data-dir does NOT persist between
// runs. The storageState file is the only source of truth for our session.
async function withContext({ headless }, fn) {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless });
  const ctxOpts = { viewport: { width: 1280, height: 800 } };
  if (existsSync(STATE_FILE)) ctxOpts.storageState = STATE_FILE;
  const ctx = await browser.newContext(ctxOpts);
  try {
    const page = await ctx.newPage();
    return await fn(ctx, page);
  } finally {
    await ctx.storageState({ path: STATE_FILE }).catch(() => {});
    await ctx.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function ensureLoggedIn(page) {
  await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
  // Give SAML auto-redirects up to 10s to settle (or arrive on a brightspace host).
  for (let i = 0; i < 20; i++) {
    if (!page.url().includes(LOGIN_HOST)) break;
    await page.waitForTimeout(500);
  }
  if (page.url().includes(LOGIN_HOST)) return false;
  // Make sure we're on the canonical host before calling the API (so cookies match).
  if (!page.url().includes('brightspace.usc.edu')) {
    await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
  }
  const r = await page.evaluate(async () => {
    const x = await fetch('/d2l/api/lp/1.0/users/whoami', { credentials: 'include', headers: { Accept: 'application/json' } });
    return x.ok;
  }).catch(() => false);
  return r === true;
}

async function callApi(page, path) {
  return await page.evaluate(async (p) => {
    const r = await fetch(p, { credentials: 'include', headers: { Accept: 'application/json' } });
    return { ok: r.ok, status: r.status, body: r.ok ? await r.json() : null };
  }, path);
}

async function callApiBinary(page, path) {
  return await page.evaluate(async (p) => {
    const r = await fetch(p, { credentials: 'include' });
    if (!r.ok) return { ok: false, status: r.status };
    const buf = await r.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return { ok: true, contentType: r.headers.get('content-type'), size: buf.byteLength, b64: btoa(s) };
  }, path);
}

// ─── Subcommands ──────────────────────────────────────────────

async function cmdLogin() {
  log('Opening browser. Complete USC NetID + password + Duo to reach the Brightspace homepage.');
  log('The window will close automatically when login is detected.');
  let success = false;
  await withContext({ headless: false }, async (ctx, page) => {
    await page.goto(HOME_URL).catch(() => {});
    try {
      // Wait for the SAML chain to land on Brightspace (any subdomain — main host or tenant URL).
      await page.waitForURL((u) => {
        const url = u.toString();
        return !url.includes(LOGIN_HOST) && /brightspace\.usc\.edu|tenants\.brightspace\.com/.test(url);
      }, { timeout: 5 * 60 * 1000 });

      // Force a navigation to the canonical home URL so cookies get set on brightspace.usc.edu too.
      log('Login detected — finalizing session...');
      await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

      // Confirm by hitting the whoami API; only declare success if the API answers.
      const whoami = await page.evaluate(async () => {
        const r = await fetch('/d2l/api/lp/1.0/users/whoami', { credentials: 'include', headers: { Accept: 'application/json' } });
        return r.ok ? await r.json() : null;
      });
      if (whoami?.Identifier) {
        log(`Logged in as ${whoami.FirstName} ${whoami.LastName}.`);
        // Give the cookie store time to flush to disk before we close the context.
        await page.waitForTimeout(3000);
        success = true;
      } else {
        log('Reached Brightspace but whoami API did not return a user. Session may be incomplete.');
      }
    } catch {
      log('Timed out waiting for login (5 minutes). Aborting.');
    }
  });
  out({ ok: success });
  process.exitCode = success ? 0 : 1;
}

async function cmdStatus() {
  const ok = await withContext({ headless: true }, async (_, page) => ensureLoggedIn(page));
  out({ loggedIn: ok });
  process.exitCode = ok ? 0 : 1;
}

async function cmdAll() {
  await withContext({ headless: true }, async (_, page) => {
    if (!await ensureLoggedIn(page)) { out({ error: 'session_expired', hint: 'Run: bs login' }); process.exitCode = 2; return; }

    const enr = await callApi(page, '/d2l/api/lp/1.0/enrollments/myenrollments/?orgUnitTypeId=3&pageSize=200');
    if (!enr.ok) { out({ error: 'enrollments_failed', status: enr.status }); process.exitCode = 3; return; }

    const courses = (enr.body.Items || [])
      .filter(x => x.Access?.IsActive)
      .map(x => ({
        courseId: x.OrgUnit.Id,
        code: (x.OrgUnit.Code.split('_')[1]) || x.OrgUnit.Code,
        term: x.OrgUnit.Code.split('_')[0],
        name: x.OrgUnit.Name.replace(/^\d+_\d+\s*/, ''),
      }));

    const withAssignments = await page.evaluate(async (cs) => {
      return await Promise.all(cs.map(async c => {
        const r = await fetch(`/d2l/api/le/1.74/${c.courseId}/dropbox/folders/`, { credentials: 'include', headers: { Accept: 'application/json' } });
        if (!r.ok) return { ...c, assignments: [], error: `HTTP ${r.status}` };
        const items = await r.json();
        const list = (Array.isArray(items) ? items : items.Items || [])
          .filter(f => !f.IsHidden)
          .map(f => ({ folderId: f.Id, name: f.Name, due: f.DueDate, totalPoints: f.Assessment?.ScoreDenominator }));
        return { ...c, assignments: list };
      }));
    }, courses);

    out({ courses: withAssignments, fetchedAt: new Date().toISOString() });
  });
}

async function cmdAssignment(courseId, folderId) {
  if (!courseId || !folderId) { log('Usage: bs assignment <courseId> <folderId>'); process.exitCode = 1; return; }
  await withContext({ headless: true }, async (_, page) => {
    if (!await ensureLoggedIn(page)) { out({ error: 'session_expired', hint: 'Run: bs login' }); process.exitCode = 2; return; }
    const r = await callApi(page, `/d2l/api/le/1.74/${courseId}/dropbox/folders/${folderId}`);
    if (!r.ok) { out({ error: 'fetch_failed', status: r.status }); process.exitCode = 3; return; }
    out(r.body);
  });
}

async function cmdDownload(courseId, folderId, fileId, outPath) {
  if (!courseId || !folderId || !fileId) {
    log('Usage: bs download <courseId> <folderId> <fileId> [outPath]');
    log('       outPath defaults to ~/Downloads/<filename>');
    process.exitCode = 1; return;
  }
  await withContext({ headless: true }, async (_, page) => {
    if (!await ensureLoggedIn(page)) { out({ error: 'session_expired', hint: 'Run: bs login' }); process.exitCode = 2; return; }

    if (!outPath) {
      // Default: look up the original filename from the assignment metadata and
      // drop into ~/Downloads/<filename>, matching what Chrome would do.
      const meta = await callApi(page, `/d2l/api/le/1.74/${courseId}/dropbox/folders/${folderId}`);
      const att = (meta.body?.Attachments || []).find(a => String(a.FileId) === String(fileId));
      const filename = att?.FileName || `attachment-${fileId}.bin`;
      outPath = `~/Downloads/${filename}`;
    }

    const r = await callApiBinary(page, `/d2l/api/le/1.74/${courseId}/dropbox/folders/${folderId}/attachments/${fileId}`);
    if (!r.ok) { out({ error: 'download_failed', status: r.status }); process.exitCode = 3; return; }
    const abs = resolve(outPath.replace(/^~/, process.env.HOME));
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, Buffer.from(r.b64, 'base64'));
    out({ ok: true, path: abs, size: r.size, contentType: r.contentType });
  });
}

// ─── Dispatch ─────────────────────────────────────────────────

const [cmd, ...args] = process.argv.slice(2);
const COMMANDS = {
  login: cmdLogin,
  status: cmdStatus,
  all: cmdAll,
  assignment: () => cmdAssignment(args[0], args[1]),
  download: () => cmdDownload(args[0], args[1], args[2], args[3]),
};

const fn = COMMANDS[cmd];
if (!fn) {
  console.error(`Usage: bs <login|status|all|assignment|download>

  login                                       Open browser and let user log in. Persists for ~days.
  status                                      Exit 0 if logged in, 1 otherwise.
  all                                         JSON: all active courses + all assignments + due dates.
  assignment <courseId> <folderId>            JSON: full assignment detail (instructions, attachments, etc).
  download <courseId> <folderId> <fileId> [outPath]
                                              Download attachment. outPath defaults to ~/Downloads/<filename>.
`);
  process.exit(1);
}

await (fn.length ? fn() : fn());
