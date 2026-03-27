/**
 * @file server.js
 * @description Main server file for Texas Joke Ranger.
 * Handles routing, authentication, database, CSRF, and static files.
 */

// === 1. DEPENDENCIES ===
const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch'); // if node <18, otherwise native

// === 2. INITIALIZATION & CONSTANTS ===
const app = express();
const port = 3001;
const isProduction = process.env.NODE_ENV === 'production';
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

let db; // Variable to hold the database connection

// === 3. RATE LIMITERS ===
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, try later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, try in 15 min.' }
});

// === 4. MIDDLEWARES ===
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: 'a_very_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: isProduction, 
    httpOnly: true, 
    sameSite: 'strict' 
  }
}));

// Middleware to inject BASE_URL in all EJS templates
app.use((req, res, next) => {
  res.locals.BASE_URL = BASE_URL;
  next();
});

// CSRF Protection Middleware
const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const csrfHeader = req.headers['x-csrf-token'];
  const csrfCookie = req.cookies['csrf-token'];
  
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return res.status(403).json({ message: 'Invalid CSRF token.' });
  }
  
  next();
};

app.use(csrfProtection);

// Authentication Verification Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/auth.html');
};

// === 5. ROUTES ===

// --- 5.1 Security Routes ---
app.get('/csrf-token', (req, res) => {
  const token = crypto.randomBytes(100).toString('hex');
  res.cookie('csrf-token', token, { secure: isProduction, httpOnly: true });
  res.json({ csrfToken: token });
});

// --- 5.2 Authentication Routes ---
app.post('/register', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username & password required.' });
  }

  try {
    const existing = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ message: 'Username already taken.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)', 
      [username, hashed]
    );
    
    res.status(201).json({ message: 'User created.', userId: result.lastID });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username & password required.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ message: 'Session error.' });
      }

      req.session.userId = user.id;
      req.session.username = user.username;

      const csrfToken = crypto.randomBytes(100).toString('hex');
      res.cookie('csrf-token', csrfToken, { secure: isProduction, httpOnly: true });

      res.json({ 
        message: 'Login successful.', 
        user: { id: user.id, username: user.username }, 
        redirect: '/jokes' 
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout error.' });
    }
    res.clearCookie('connect.sid');
    res.clearCookie('csrf-token');
    res.redirect('/auth.html');
  });
});

app.get('/profile', isAuthenticated, (req, res) => {
  res.json({ 
    isLoggedIn: true, 
    user: { id: req.session.userId, username: req.session.username } 
  });
});

// --- 5.3 Page/View Routes ---
app.get('/jokes', isAuthenticated, async (req, res) => {
  try {
    const jokePromises = Array.from({ length: 10 }, () => 
      fetch('https://api.chucknorris.io/jokes/random').then(r => r.json())
    );
    const jokes = await Promise.all(jokePromises);
    const favorites = await db.all('SELECT * FROM favorites WHERE user_id = ?', [req.session.userId]);
    
    res.render('jokes', { jokes, favorites, user: req.session.username });
  } catch (err) {
    console.error('Error fetching jokes:', err);
    res.status(500).send('Error fetching jokes.');
  }
});

// --- FAVORITES PAGE ---
// Temporarily replace your route with this one
app.get('/favorites', (req, res) => {
  res.send("The server successfully sees the favorites route!");
});

// --- 5.4 API Routes ---
app.get('/api/favorites', isAuthenticated, async (req, res) => {
  try {
    const favorites = await db.all('SELECT * FROM favorites WHERE user_id = ?', [req.session.userId]);
    res.json(favorites);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ message: 'Error fetching favorites.' });
  }
});

app.post('/api/favorites', isAuthenticated, async (req, res) => {
  const { joke_id, joke_text } = req.body;
  
  if (!joke_id || !joke_text) {
    return res.status(400).json({ message: 'Joke ID & text required.' });
  }

  try {
    const existing = await db.get(
      'SELECT * FROM favorites WHERE user_id = ? AND joke_id = ?', 
      [req.session.userId, joke_id]
    );
    
    if (existing) {
      return res.status(409).json({ message: 'Already in favorites.' });
    }

    const result = await db.run(
      'INSERT INTO favorites (user_id, joke_id, joke_text) VALUES (?, ?, ?)', 
      [req.session.userId, joke_id, joke_text]
    );
    
    res.status(201).json({ message: 'Favorite added.', favoriteId: result.lastID });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ message: 'Error adding favorite.' });
  }
});

app.delete('/api/favorites/:joke_id', isAuthenticated, async (req, res) => {
  const { joke_id } = req.params;
  
  try {
    const result = await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND joke_id = ?', 
      [req.session.userId, joke_id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Favorite not found.' });
    }
    
    res.json({ message: 'Favorite deleted.' });
  } catch (err) {
    console.error('Error deleting favorite:', err);
    res.status(500).json({ message: 'Error deleting favorite.' });
  }
});

// === 6. DATABASE CONNECTION & SERVER START ===
(async () => {
  try {
    db = await open({ 
      filename: './db.sqlite', 
      driver: sqlite3.Database 
    });
    console.log('Connected to SQLite database.');

    app.listen(port, () => {
      console.log(`Server running at ${BASE_URL}`);
    });
  } catch (err) {
    console.error('DB connection error:', err);
  }
})();