import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('app.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    data TEXT NOT NULL,
    result TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    user_id INTEGER,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create default admin if not exists
const adminEmail = 'admin@hairai.com';
const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(adminEmail, hash, 'admin');
  console.log('Default admin created: admin@hairai.com / admin123');
}

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(express.json());

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdminMiddleware = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// API Routes
app.post('/api/auth/signup', (req: any, res: any) => {
  const { email, password } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hash);
    const user = { id: result.lastInsertRowid, email, role: 'user' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err: any) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/auth/login', (req: any, res: any) => {
  const { email, password } = req.body;
  const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get('/api/me', authenticate, (req: any, res: any) => {
  res.json({ user: req.user });
});

// Analytics tracking
app.post('/api/events', (req: any, res: any) => {
  const { type, metadata, userId } = req.body;
  db.prepare('INSERT INTO events (type, user_id, metadata) VALUES (?, ?, ?)').run(type, userId || null, JSON.stringify(metadata));
  res.json({ status: 'ok' });
});

// Assessments
app.post('/api/assessments', authenticate, (req: any, res: any) => {
  const { data, result } = req.body;
  const userId = req.user.id;
  db.prepare('INSERT INTO assessments (user_id, data, result) VALUES (?, ?, ?)').run(userId, JSON.stringify(data), result);
  res.json({ status: 'ok' });
});

app.get('/api/assessments', authenticate, (req: any, res: any) => {
  const assessments = db.prepare('SELECT * FROM assessments WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(assessments);
});

// Admin routes
app.get('/api/admin/users', authenticate, isAdminMiddleware, (req: any, res: any) => {
  const users = db.prepare('SELECT id, email, role, created_at FROM users').all();
  res.json(users);
});

app.get('/api/admin/stats', authenticate, isAdminMiddleware, (req: any, res: any) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const assessmentCount = db.prepare('SELECT COUNT(*) as count FROM assessments').get() as any;
  const recentEvents = db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 50').all();
  
  // Aggregate events for charts
  const viewsByDay = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM events WHERE type = 'page_view' 
    GROUP BY date LIMIT 7
  `).all();

  res.json({
    users: userCount.count,
    assessments: assessmentCount.count,
    recentEvents,
    viewsByDay
  });
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
