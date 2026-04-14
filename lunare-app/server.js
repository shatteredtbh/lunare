require('dotenv').config();
const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { Pool }   = require('pg');
const path       = require('path');

const app  = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('railway')
    ? { rejectUnauthorized: false }
    : false,
});

const JWT_SECRET    = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ADMIN_USER    = process.env.ADMIN_USERNAME || 'nilasumi';
const ADMIN_PASS    = process.env.ADMIN_PASSWORD || '123suminila123';
const PORT          = process.env.PORT || 3000;
const COOKIE_OPTS   = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* ── Middleware: verify JWT from cookie ── */
function requireAuth(req, res, next) {
  const token = req.cookies.lunare_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie('lunare_token');
    return res.status(401).json({ error: 'Session expired' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    next();
  });
}

/* ══════════════════════════════════════
   AUTH ROUTES
══════════════════════════════════════ */

/* POST /api/login */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  /* Admin login — credentials checked server-side only, never in source */
  if (username === ADMIN_USER) {
    if (password !== ADMIN_PASS)
      return res.status(401).json({ error: 'Incorrect password' });
    const token = jwt.sign({ username: ADMIN_USER, name: 'Nila', isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('lunare_token', token, COOKIE_OPTS);
    return res.json({ name: 'Nila', isAdmin: true });
  }

  /* Regular user login */
  const email = username.toLowerCase();
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'No account found with that email' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, isAdmin: false }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('lunare_token', token, COOKIE_OPTS);
    return res.json({ name: user.name, isAdmin: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/signup */
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (email.toLowerCase() === ADMIN_USER)
    return res.status(400).json({ error: 'That email is not available' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ error: 'An account with that email already exists' });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), email.toLowerCase(), hash]
    );
    const user = rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, isAdmin: false }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('lunare_token', token, COOKIE_OPTS);
    return res.status(201).json({ name: user.name, isAdmin: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/logout */
app.post('/api/logout', (req, res) => {
  res.clearCookie('lunare_token');
  res.json({ ok: true });
});

/* GET /api/me — check current session */
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ name: req.user.name, isAdmin: req.user.isAdmin, email: req.user.email || req.user.username });
});

/* ══════════════════════════════════════
   PRODUCTS ROUTES
══════════════════════════════════════ */

/* GET /api/products — public */
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY sort_order, id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* PUT /api/products/:id — admin only */
app.put('/api/products/:id', requireAdmin, async (req, res) => {
  const { tag, name, description, price, swatch, soap } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE products SET tag=$1, name=$2, description=$3, price=$4, swatch=$5, soap=$6 WHERE id=$7 RETURNING *',
      [tag, name, description, price, swatch, soap, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/products — admin only */
app.post('/api/products', requireAdmin, async (req, res) => {
  const { tag, name, description, price, swatch, soap } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO products (tag, name, description, price, swatch, soap) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [tag || 'New', name || 'New soap', description || '', price || 12, swatch || 'swatch-a', soap || 'soap-a']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* DELETE /api/products/:id — admin only */
app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ══════════════════════════════════════
   SITE SETTINGS ROUTES
══════════════════════════════════════ */

/* GET /api/settings — public */
app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM site_settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value === 'true' ? true : r.value === 'false' ? false : r.value; });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* PUT /api/settings — admin only */
app.put('/api/settings', requireAdmin, async (req, res) => {
  const entries = Object.entries(req.body);
  try {
    for (const [key, value] of entries) {
      await pool.query(
        'INSERT INTO site_settings (key, value, updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()',
        [key, String(value)]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ══════════════════════════════════════
   USERS ROUTES (admin only)
══════════════════════════════════════ */

/* GET /api/users */
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* DELETE /api/users/:id */
app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ══════════════════════════════════════
   NEWSLETTER
══════════════════════════════════════ */
app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });
  try {
    await pool.query('INSERT INTO newsletter_subs (email) VALUES ($1) ON CONFLICT DO NOTHING', [email.toLowerCase()]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/newsletter/count', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT COUNT(*) FROM newsletter_subs');
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ══════════════════════════════════════
   FALLBACK — serve index.html for SPA
══════════════════════════════════════ */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Lunare server running on port ${PORT}`);
});
