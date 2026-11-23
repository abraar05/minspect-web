// @mInspect API — zero-dependency Node.js backend
// Uses only Node built-ins: http, crypto, fs, child_process (sqlite3 CLI)
import http from 'node:http';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8000', 10);
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'minspect.db');
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || '';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || '';
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Administrator';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';
const googleStates = new Map();

function googleConfigured() {
  const values = `${GOOGLE_CLIENT_ID} ${GOOGLE_CLIENT_SECRET} ${GOOGLE_REDIRECT_URI}`;
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REDIRECT_URI) && !/your-|example\.com|placeholder/i.test(values);
}

function sendRedirect(res, url) {
  res.writeHead(302, { Location: url });
  res.end();
}

// CORS origins
const ALLOWED_ORIGINS = [
  FRONTEND_URL,
  'https://abraar05.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

// ─── Password hashing (PBKDF2 via Node crypto) ─────────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512');
  // Store as hex: prefix.salt.hash
  return 'pbkdf2:' + salt.toString('hex') + ':' + hash.toString('hex');
}

function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('pbkdf2:')) return false;
  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const salt = Buffer.from(parts[1], 'hex');
  const expectedHash = parts[2];
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash.toString('hex')), Buffer.from(expectedHash));
  } catch {
    return false;
  }
}

// ─── JWT (HS256, Node crypto only) ──────────────────────────────────
function createJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + 86400 * 30 };
  const segments = [
    Buffer.from(JSON.stringify(header)).toString('base64url'),
    Buffer.from(JSON.stringify(body)).toString('base64url'),
  ];
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(segments.join('.')).digest('base64url');
  segments.push(sig);
  return segments.join('.');
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url');
    if (sig !== parts[2]) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── SQLite via execFileSync (no shell interpretation) ──────────────
function sqlExec(statements) {
  // Uses stdin to pass SQL, avoiding all shell escaping issues
  try {
    return execFileSync('sqlite3', [DB_PATH], {
      input: statements,
      encoding: 'utf8',
      timeout: 10000,
    });
  } catch (e) {
    if (e.stderr && !e.stderr.includes('not an error')) {
      console.error('SQL exec error:', e.stderr);
    }
    return e.stdout || '';
  }
}

function sql(query, params = []) {
  // Replace ? placeholders with properly escaped values
  let i = 0;
  const q = query.replace(/\?/g, () => {
    const p = params[i++];
    if (p === null || p === undefined) return 'NULL';
    if (typeof p === 'number') return String(p);
    if (typeof p === 'boolean') return p ? '1' : '0';
    // Escape single quotes by doubling them
    return "'" + String(p).replace(/'/g, "''") + "'";
  });

  const fullQuery = `.mode json\n${q};`;
  const result = sqlExec(fullQuery).trim();
  if (!result || result.startsWith('Error') || result.startsWith('Parse error')) {
    if (result && result.startsWith('Error')) console.error('SQL query error:', result, '\nQuery:', q);
    return [];
  }
  try {
    return JSON.parse(result);
  } catch {
    return [];
  }
}

function sqlRun(query, params = []) {
  let i = 0;
  const q = query.replace(/\?/g, () => {
    const p = params[i++];
    if (p === null || p === undefined) return 'NULL';
    if (typeof p === 'number') return String(p);
    if (typeof p === 'boolean') return p ? '1' : '0';
    return "'" + String(p).replace(/'/g, "''") + "'";
  });
  sqlExec(q + ';');
}

function sqlOne(query, params = []) {
  const rows = sql(query, params);
  return rows.length > 0 ? rows[0] : null;
}

// ─── Database initialization ────────────────────────────────────────
function initDB() {
  const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_login_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  module TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS role_user (
  role_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, user_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS permission_role (
  permission_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY (permission_id, role_id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  meta TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS allowed_google_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  added_by INTEGER,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS google_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  google_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
`;

  sqlExec(schema);

  // Seed roles
  sqlRun("INSERT OR IGNORE INTO roles (name, description) VALUES ('admin', 'Full system access')");
  sqlRun("INSERT OR IGNORE INTO roles (name, description) VALUES ('staff', 'Standard staff member')");
  sqlRun("INSERT OR IGNORE INTO roles (name, description) VALUES ('viewer', 'Read-only access')");

  // Seed permissions
  const perms = [
    ['products.view', 'products'], ['products.manage', 'products'],
    ['inventory.view', 'inventory'], ['inventory.manage', 'inventory'],
    ['sales.view', 'sales'], ['sales.manage', 'sales'],
    ['purchases.view', 'purchases'], ['purchases.manage', 'purchases'],
    ['reports.view', 'reports'], ['users.manage', 'admin'],
    ['roles.manage', 'admin'], ['audit.view', 'admin'],
  ];
  for (const [key, mod] of perms) {
    sqlRun("INSERT OR IGNORE INTO permissions (key, module) VALUES (?, ?)", [key, mod]);
  }

  // Grant all permissions to admin role
  const adminRole = sqlOne("SELECT id FROM roles WHERE name = 'admin'");
  if (adminRole) {
    const allPerms = sql("SELECT id FROM permissions");
    for (const p of allPerms) {
      sqlRun("INSERT OR IGNORE INTO permission_role (permission_id, role_id) VALUES (?, ?)", [p.id, adminRole.id]);
    }
  }

  // Seed admin user
  if (SEED_ADMIN_EMAIL && SEED_ADMIN_PASSWORD) {
    const existing = sqlOne("SELECT id FROM users WHERE email = ?", [SEED_ADMIN_EMAIL.toLowerCase()]);
    if (!existing) {
      const hash = hashPassword(SEED_ADMIN_PASSWORD);
      sqlRun("INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, 'active')",
        [SEED_ADMIN_NAME, SEED_ADMIN_EMAIL.toLowerCase(), hash]);
      const user = sqlOne("SELECT id FROM users WHERE email = ?", [SEED_ADMIN_EMAIL.toLowerCase()]);
      if (user && adminRole) {
        sqlRun("INSERT OR IGNORE INTO role_user (role_id, user_id) VALUES (?, ?)", [adminRole.id, user.id]);
      }
      console.log(`✓ Admin seeded: ${SEED_ADMIN_EMAIL}`);
    } else {
      console.log(`✓ Admin exists: ${SEED_ADMIN_EMAIL}`);
    }
  }

  console.log('✓ Database initialized');
}

// ─── Helpers ────────────────────────────────────────────────────────
function getUserWithRoles(userId) {
  const user = sqlOne("SELECT id, name, email, phone, status, last_login_at, created_at, updated_at FROM users WHERE id = ?", [userId]);
  if (!user) return null;
  const roles = sql("SELECT r.name FROM roles r JOIN role_user ru ON r.id = ru.role_id WHERE ru.user_id = ?", [userId]);
  user.roles = roles.map(r => r.name);
  const perms = sql(
    "SELECT DISTINCT p.key FROM permissions p JOIN permission_role pr ON p.id = pr.permission_id JOIN role_user ru ON pr.role_id = ru.role_id WHERE ru.user_id = ?",
    [userId]
  );
  user.permissions = perms.map(p => p.key);
  return user;
}

function createToken(userId) {
  return createJWT({ sub: userId, jti: crypto.randomUUID() });
}

function audit(userId, action, meta, ip, ua) {
  sqlRun("INSERT INTO audit_logs (user_id, action, meta, ip, user_agent) VALUES (?, ?, ?, ?, ?)",
    [userId, action, JSON.stringify(meta || {}), ip || null, ua || null]);
}

// ─── HTTP helpers ───────────────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 1e6) reject(new Error('Too large')); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function sendJSON(res, data, status = 200) {
  const j = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(j) });
  res.end(j);
}

function getAuth(req) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return null;
  const payload = verifyJWT(h.slice(7));
  if (!payload || !payload.sub) return null;
  return getUserWithRoles(payload.sub);
}

function corsHeaders(req) {
  const origin = req.headers['origin'];
  const allowed = ALLOWED_ORIGINS.find(o => origin && origin.startsWith(o)) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// ─── Router ─────────────────────────────────────────────────────────
const routes = [];
function route(method, pat, handler) {
  const re = new RegExp('^' + pat.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$');
  routes.push({ method, re, handler });
}

// ─── Routes ─────────────────────────────────────────────────────────

route('GET', '/', (req, res) => sendJSON(res, { name: '@mInspect API', version: '1.0.0', status: 'running' }));
route('GET', '/api/health', (req, res) => sendJSON(res, { status: 'ok', name: '@mInspect API', time: new Date().toISOString() }));

// Register
route('POST', '/api/register', async (req, res) => {
  const b = await parseBody(req);
  const errors = {};
  if (!b.name) errors.name = ['The name field is required.'];
  if (!b.email) errors.email = ['The email field is required.'];
  if (!b.password || String(b.password).length < 3) errors.password = ['The password must be at least 3 characters.'];
  if (Object.keys(errors).length) return sendJSON(res, { message: 'Validation failed.', errors }, 422);

  const email = b.email.toLowerCase();
  if (sqlOne("SELECT id FROM users WHERE email = ?", [email])) {
    return sendJSON(res, { message: 'Validation failed.', errors: { email: ['The email has already been taken.'] } }, 422);
  }

  const hash = hashPassword(b.password);
  sqlRun("INSERT INTO users (name, email, password, phone, status) VALUES (?, ?, ?, ?, 'active')", [b.name, email, hash, b.phone || null]);
  const user = sqlOne("SELECT id FROM users WHERE email = ?", [email]);
  const staffRole = sqlOne("SELECT id FROM roles WHERE name = 'staff'");
  if (user && staffRole) sqlRun("INSERT OR IGNORE INTO role_user (role_id, user_id) VALUES (?, ?)", [staffRole.id, user.id]);
  audit(user?.id, 'user.registered', { email }, req.socket.remoteAddress, req.headers['user-agent']);
  sendJSON(res, { user: getUserWithRoles(user.id), token: createToken(user.id) }, 201);
});

// Login
route('POST', '/api/login', async (req, res) => {
  const b = await parseBody(req);
  if (!b.email || !b.password) return sendJSON(res, { message: 'Invalid credentials.' }, 401);

  const email = b.email.toLowerCase();
  const user = sqlOne("SELECT id, password, status FROM users WHERE email = ?", [email]);
  if (!user || !verifyPassword(b.password, user.password)) {
    audit(null, 'auth.login_failed', { email }, req.socket.remoteAddress, req.headers['user-agent']);
    return sendJSON(res, { message: 'Invalid credentials.' }, 401);
  }
  if (user.status !== 'active') return sendJSON(res, { message: 'This account is inactive.' }, 403);

  sqlRun("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", [user.id]);
  audit(user.id, 'auth.login', {}, req.socket.remoteAddress, req.headers['user-agent']);
  sendJSON(res, { user: getUserWithRoles(user.id), token: createToken(user.id) });
});

// Logout
route('POST', '/api/logout', (req, res) => {
  const user = getAuth(req);
  if (!user) return sendJSON(res, { message: 'Unauthenticated.' }, 401);
  audit(user.id, 'auth.logout', {}, req.socket.remoteAddress, req.headers['user-agent']);
  sendJSON(res, { message: 'Logged out.' });
});

// Me
route('GET', '/api/me', (req, res) => {
  const user = getAuth(req);
  if (!user) return sendJSON(res, { message: 'Unauthenticated.' }, 401);
  sendJSON(res, user);
});

route('GET', '/api/auth/google/status', (req, res) => {
  sendJSON(res, { configured: googleConfigured() });
});

route('GET', '/api/auth/google/redirect', (req, res) => {
  if (!googleConfigured()) {
    return sendRedirect(res, `${FRONTEND_URL}/login?error=${encodeURIComponent('Google sign-in is not configured yet.')}`);
  }
  const state = crypto.randomBytes(24).toString('hex');
  googleStates.set(state, Date.now() + 10 * 60 * 1000);
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');
  sendRedirect(res, url.toString());
});

route('GET', '/api/auth/google/callback', async (req, res) => {
  const fail = (message) => sendRedirect(res, `${FRONTEND_URL}/login?error=${encodeURIComponent(message)}`);
  if (!googleConfigured()) return fail('Google sign-in is not configured yet.');

  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expiresAt = state ? googleStates.get(state) : null;
  if (state) googleStates.delete(state);
  if (!code || !expiresAt || expiresAt < Date.now()) return fail('Google sign-in could not be completed.');

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) return fail('Google sign-in could not be completed.');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.email) return fail('Google sign-in could not be completed.');

    const email = String(profile.email).toLowerCase();
    const allowed = sqlOne('SELECT id FROM allowed_google_accounts WHERE lower(email) = ? AND active = 1', [email]);
    if (!allowed) {
      audit(null, 'auth.google_denied', { email }, req.socket.remoteAddress, req.headers['user-agent']);
      return fail('This Google account is not approved by an administrator.');
    }

    let account = sqlOne('SELECT user_id FROM google_accounts WHERE google_id = ?', [String(profile.sub)]);
    let userId = account?.user_id;
    if (!userId) {
      let user = sqlOne('SELECT id, status FROM users WHERE email = ?', [email]);
      if (!user) {
        sqlRun("INSERT INTO users (name, email, password, status) VALUES (?, ?, ?, 'active')", [
          profile.name || email.split('@')[0],
          email,
          hashPassword(crypto.randomBytes(24).toString('hex')),
        ]);
        user = sqlOne('SELECT id, status FROM users WHERE email = ?', [email]);
        const staffRole = sqlOne("SELECT id FROM roles WHERE name = 'staff'");
        if (user && staffRole) sqlRun('INSERT OR IGNORE INTO role_user (role_id, user_id) VALUES (?, ?)', [staffRole.id, user.id]);
      }
      if (user.status !== 'active') return fail('This account is inactive.');
      userId = user.id;
      sqlRun('INSERT INTO google_accounts (user_id, google_id, email, name, avatar) VALUES (?, ?, ?, ?, ?)', [
        userId,
        String(profile.sub),
        email,
        profile.name || null,
        profile.picture || null,
      ]);
    }

    sqlRun("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", [userId]);
    audit(userId, 'auth.google_login', { email }, req.socket.remoteAddress, req.headers['user-agent']);
    sendRedirect(res, `${FRONTEND_URL}/auth/google/callback?token=${encodeURIComponent(createToken(userId))}`);
  } catch {
    fail('Google sign-in could not be completed.');
  }
});

// Admin: list allowed Google accounts
route('GET', '/api/admin/allowed-google-accounts', (req, res) => {
  const user = getAuth(req);
  if (!user) return sendJSON(res, { message: 'Unauthenticated.' }, 401);
  if (!user.roles.includes('admin')) return sendJSON(res, { message: 'Forbidden.' }, 403);

  const rows = sql("SELECT a.*, u.name as added_by_name FROM allowed_google_accounts a LEFT JOIN users u ON a.added_by = u.id ORDER BY a.created_at DESC");
  sendJSON(res, rows.map(a => ({
    id: a.id, email: a.email, name: a.name, active: !!a.active,
    created_at: a.created_at, updated_at: a.updated_at,
    added_by: a.added_by ? { id: a.added_by, name: a.added_by_name } : null,
  })));
});

// Admin: add allowed Google account
route('POST', '/api/admin/allowed-google-accounts', async (req, res) => {
  const user = getAuth(req);
  if (!user) return sendJSON(res, { message: 'Unauthenticated.' }, 401);
  if (!user.roles.includes('admin')) return sendJSON(res, { message: 'Forbidden.' }, 403);
  const b = await parseBody(req);
  if (!b.email) return sendJSON(res, { message: 'Validation failed.', errors: { email: ['Required.'] } }, 422);
  const email = b.email.toLowerCase();
  if (sqlOne("SELECT id FROM allowed_google_accounts WHERE email = ?", [email])) {
    return sendJSON(res, { message: 'Validation failed.', errors: { email: ['Already exists.'] } }, 422);
  }
  sqlRun("INSERT INTO allowed_google_accounts (email, name, added_by, active) VALUES (?, ?, ?, 1)", [email, b.name || null, user.id]);
  const record = sqlOne("SELECT * FROM allowed_google_accounts WHERE email = ?", [email]);
  audit(user.id, 'admin.google_allowlist_added', { email }, req.socket.remoteAddress, req.headers['user-agent']);
  sendJSON(res, record, 201);
});

// Admin: update allowed Google account
route('PATCH', '/api/admin/allowed-google-accounts/:id', async (req, res, params) => {
  const user = getAuth(req);
  if (!user) return sendJSON(res, { message: 'Unauthenticated.' }, 401);
  if (!user.roles.includes('admin')) return sendJSON(res, { message: 'Forbidden.' }, 403);
  const record = sqlOne("SELECT * FROM allowed_google_accounts WHERE id = ?", [params.id]);
  if (!record) return sendJSON(res, { message: 'Not found.' }, 404);
  const b = await parseBody(req);
  if (b.name !== undefined) sqlRun("UPDATE allowed_google_accounts SET name = ?, updated_at = datetime('now') WHERE id = ?", [b.name, params.id]);
  if (b.active !== undefined) sqlRun("UPDATE allowed_google_accounts SET active = ?, updated_at = datetime('now') WHERE id = ?", [b.active ? 1 : 0, params.id]);
  audit(user.id, 'admin.google_allowlist_updated', { email: record.email }, req.socket.remoteAddress, req.headers['user-agent']);
  sendJSON(res, sqlOne("SELECT * FROM allowed_google_accounts WHERE id = ?", [params.id]));
});

// Admin: delete allowed Google account
route('DELETE', '/api/admin/allowed-google-accounts/:id', async (req, res, params) => {
  const user = getAuth(req);
  if (!user) return sendJSON(res, { message: 'Unauthenticated.' }, 401);
  if (!user.roles.includes('admin')) return sendJSON(res, { message: 'Forbidden.' }, 403);
  const record = sqlOne("SELECT * FROM allowed_google_accounts WHERE id = ?", [params.id]);
  if (!record) return sendJSON(res, { message: 'Not found.' }, 404);
  sqlRun("DELETE FROM allowed_google_accounts WHERE id = ?", [params.id]);
  audit(user.id, 'admin.google_allowlist_removed', { email: record.email }, req.socket.remoteAddress, req.headers['user-agent']);
  sendJSON(res, { message: 'Removed.' });
});

// ─── Server ─────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const ch = corsHeaders(req);
  for (const [k, v] of Object.entries(ch)) res.setHeader(k, v);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname.replace(/\/$/, '') || '/';
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = pathname.match(r.re);
    if (m) {
      try { await r.handler(req, res, m.groups || {}); } catch (err) {
        console.error('Error:', err);
        if (!res.headersSent) sendJSON(res, { message: 'Internal server error.' }, 500);
      }
      return;
    }
  }
  sendJSON(res, { message: 'Not found.' }, 404);
});

// ─── Bootstrap ──────────────────────────────────────────────────────
initDB();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 @mInspect API → http://0.0.0.0:${PORT}`);
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   DB: ${DB_PATH}\n`);
});
