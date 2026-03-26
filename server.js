/**
 * @file server.js
 * @description This is the main server file for the Texas Joke Ranger application.
 * It handles routing, authentication, database interaction, and serving static files.
 * It uses Express.js as the web framework and SQLite for the database.
 */

// === DEPENDENCIES ===
const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');
const rateLimit = require('express-rate-limit');

// === EXPRESS APP SETUP ===
const app = express();
const port = 3001;
const isProduction = process.env.NODE_ENV === 'production';

// === CONSTANTS ===
// Base URL for the site, used in templates to ensure correct paths.
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

// === RATE LIMITING (Security) ===
// A global rate limiter to prevent abuse. Limits to 100 requests per 15 minutes.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// A stricter rate limiter for authentication routes to prevent brute-force attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again in 15 minutes.' }
});

let db; // Variable to hold the database connection.

// === MIDDLEWARES ===
app.set('view engine', 'ejs'); // Set EJS as the templating engine.
app.set('views', path.join(__dirname, 'views')); // Set the directory for view templates.
app.use(express.json()); // Parse JSON request bodies.
app.use(cookieParser()); // Parse cookies.
app.use(express.static('.')); // Serve static files from the root directory.

// Apply the global rate limiter to all requests.
app.use(globalLimiter);

// Middleware to make the BASE_URL available in all EJS templates.
app.use((req, res, next) => {
  res.locals.BASE_URL = BASE_URL;
  next();
});

// Session management configuration.
app.use(session({
  secret: 'a_very_secret_key', // Should be replaced with a long, random string in production.
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: isProduction, // Use secure cookies in production (HTTPS).
    httpOnly: true, // Prevents client-side JS from accessing the cookie.
    sameSite: 'strict' // Helps mitigate CSRF attacks.
  }
}));

// === AUTHENTICATION MIDDLEWARE ===
/**
 * Checks if a user is authenticated by verifying the session.
 * If not authenticated, redirects to the authentication page.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next(); // User is authenticated, proceed to the next middleware/handler.
  } else {
    res.redirect('/auth.html'); // User is not authenticated, redirect to login.
  }
};

// === CSRF PROTECTION MIDDLEWARE ===
/**
 * A basic CSRF protection middleware.
 * It checks for a valid CSRF token in the request header for non-GET requests.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const csrfProtection = (req, res, next) => {
    // Skip CSRF check for safe methods.
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const csrfTokenFromHeader = req.headers['x-csrf-token'];
    const csrfTokenFromCookie = req.cookies['csrf-token'];

    // If tokens are missing or don't match, reject the request.
    if (!csrfTokenFromHeader || !csrfTokenFromCookie || csrfTokenFromHeader !== csrfTokenFromCookie) {
        return res.status(403).json({ message: 'Action not authorized (Invalid CSRF token).' });
    }

    next();
};

app.use(csrfProtection); // Apply CSRF protection to all relevant routes.

// === DATABASE CONNECTION & SERVER START ===
(async () => {
  try {
    // Open a connection to the SQLite database.
    db = await open({
      filename: './db.sqlite',
      driver: sqlite3.Database
    });
    console.log('Connected to the SQLite database.');

    // Start the Express server.
    app.listen(port, () => {
      console.log(`Server started on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
})();

// === ROUTES ===

/**
 * @route GET /csrf-token
 * @description Generates and provides a CSRF token to the client.
 * The client stores this and sends it back in headers for subsequent state-changing requests.
 */
app.get('/csrf-token', (req, res) => {
    const csrfToken = crypto.randomBytes(100).toString('hex');
    // Send the token in a cookie that is not accessible by client-side scripts.
    res.cookie('csrf-token', csrfToken, { secure: isProduction, httpOnly: true }); 
    // Also send it as JSON so the client-side script can store it for use in headers.
    res.json({ csrfToken });
});

/**
 * @route GET /jokes
 * @description (Protected) Fetches 10 random jokes from an external API and renders the jokes page.
 */
app.get('/jokes', isAuthenticated, async (req, res) => {
  try {
    const jokePromises = [];
    for (let i = 0; i < 10; i++) {
      jokePromises.push(fetch('https://api.chucknorris.io/jokes/random').then(res => res.json()));
    }
    const jokes = await Promise.all(jokePromises);
    const favorites = await db.all('SELECT * FROM favorites WHERE user_id = ?', [req.session.userId]);
    res.render('jokes', { jokes, favorites, user: req.session.username });
  } catch (err) {
    res.status(500).send('Error fetching jokes.');
  }
});

// --- AUTHENTICATION ROUTES ---

/**
 * @route POST /register
 * @description (Rate-limited) Handles new user registration.
 * Hashes the password before storing it in the database.
 */
app.post('/register', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  try {
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(409).json({ message: 'This username is already taken.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ message: 'User created successfully.', userId: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route POST /login
 * @description (Rate-limited) Handles user login.
 * On success, it regenerates the session to prevent session fixation attacks.
 */
app.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    // Regenerate session to protect against session fixation.
    req.session.regenerate(function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error regenerating session.' });
        }

        // Store user info in the new session.
        req.session.userId = user.id;
        req.session.username = user.username;

        // Create a new CSRF token for the new session.
        const csrfToken = crypto.randomBytes(100).toString('hex');
        res.cookie('csrf-token', csrfToken, { secure: isProduction, httpOnly: true });

        // Respond with success and redirect information.
        res.status(200).json({ message: 'Login successful.', user: { id: user.id, username: user.username }, redirect: '/jokes' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * @route GET /logout
 * @description Logs the user out by destroying the session and clearing cookies.
 */
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error during logout.' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie.
    res.clearCookie('csrf-token'); // Clear the CSRF token cookie.
    res.redirect('/auth.html');
  });
});

// --- PROTECTED ROUTES ---

/**
 * @route GET /profile
 * @description (Protected) Returns profile information for the logged-in user.
 * Used to check if a user is logged in from the client-side.
 */
app.get('/profile', isAuthenticated, (req, res) => {
  res.status(200).json({
    isLoggedIn: true,
    user: { id: req.session.userId, username: req.session.username }
  });
});

// --- FAVORITES API ROUTES (PROTECTED) ---

/**
 * @route GET /api/favorites
 * @description (Protected) Fetches all favorited jokes for the current user.
 */
app.get('/api/favorites', isAuthenticated, async (req, res) => {
  try {
    const favorites = await db.all('SELECT * FROM favorites WHERE user_id = ?', [req.session.userId]);
    res.status(200).json(favorites);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching favorites.' });
  }
});

/**
 * @route POST /api/favorites
 * @description (Protected) Adds a new joke to the user's favorites.
 */
app.post('/api/favorites', isAuthenticated, async (req, res) => {
  const { joke_id, joke_text } = req.body;
  if (!joke_id || !joke_text) {
    return res.status(400).json({ message: 'Joke ID and text are required.' });
  }

  try {
    // Prevent adding duplicate favorites.
    const existing = await db.get('SELECT * FROM favorites WHERE user_id = ? AND joke_id = ?', [req.session.userId, joke_id]);
    if (existing) {
      return res.status(409).json({ message: 'This joke is already in your favorites.' });
    }

    const result = await db.run(
      'INSERT INTO favorites (user_id, joke_id, joke_text) VALUES (?, ?, ?)',
      [req.session.userId, joke_id, joke_text]
    );
    res.status(201).json({ message: 'Favorite added successfully.', favoriteId: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Error adding favorite.' });
  }
});

/**
 * @route DELETE /api/favorites/:joke_id
 * @description (Protected) Deletes a joke from the user's favorites.
 */
app.delete('/api/favorites/:joke_id', isAuthenticated, async (req, res) => {
  const { joke_id } = req.params;
  try {
    const result = await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND joke_id = ?',
      [req.session.userId, joke_id]
    );

    if (result.changes === 0) {
      // This can happen if the favorite doesn't exist or belongs to another user.
      return res.status(404).json({ message: 'Favorite not found or you are not authorized to delete it.' });
    }

    res.status(200).json({ message: 'Favorite deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting favorite.' });
  }
});
