const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const ejs = require('ejs');
const path = require('path');

const app = express();
const port = 3001;
const isProduction = process.env.NODE_ENV === 'production';
let db;

// Middlewares
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('.'));

// Configuration de la session
app.use(session({
  secret: 'a_very_secret_key', // À changer pour une vraie clé secrète en production
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: isProduction, 
    httpOnly: true,
    sameSite: 'strict'
  }
}));

// === MIDDLEWARE DE VÉRIFICATION D'AUTHENTIFICATION ===
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next(); // L'utilisateur est connecté, on continue
  } else {
    res.redirect('/auth.html');
  }
};

// === MIDDLEWARE DE PROTECTION CSRF ===
const csrfProtection = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const csrfTokenFromHeader = req.headers['x-csrf-token'];
    const csrfTokenFromCookie = req.cookies['csrf-token'];

    if (!csrfTokenFromHeader || !csrfTokenFromCookie || csrfTokenFromHeader !== csrfTokenFromCookie) {
        return res.status(403).json({ message: 'Action non autorisée (CSRF token invalide).' });
    }

    next();
};

app.use(csrfProtection);

// Connexion à la base de données et démarrage du serveur
(async () => {
  try {
    db = await open({
      filename: './db.sqlite',
      driver: sqlite3.Database
    });
    console.log('Connecté à la base de données SQLite.');

    app.listen(port, () => {
      console.log(`Serveur démarré sur http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Erreur de connexion à la base de données:', err.message);
  }
})();

app.get('/csrf-token', (req, res) => {
    const csrfToken = crypto.randomBytes(100).toString('hex');
    res.cookie('csrf-token', csrfToken, { secure: isProduction, httpOnly: true }); 
    res.json({ csrfToken });
});

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
    res.status(500).send('Erreur lors de la récupération des blagues.');
  }
});

// === ROUTES D'AUTHENTIFICATION ===

// Inscription
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe requis.' });
  }
  try {
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(409).json({ message: 'Ce nom d\'utilisateur est déjà pris.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ message: 'Utilisateur créé avec succès.', userId: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

// Connexion
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe requis.' });
  }
  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }
    
    req.session.regenerate(function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la régénération de la session.' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        const csrfToken = crypto.randomBytes(100).toString('hex');
        res.cookie('csrf-token', csrfToken, { secure: isProduction, httpOnly: true });

        res.status(200).json({ message: 'Connexion réussie.', user: { id: user.id, username: user.username }, redirect: '/jokes' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

// Déconnexion
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la déconnexion.' });
    }
    res.clearCookie('connect.sid');
    res.clearCookie('csrf-token');
    res.redirect('/auth.html');
  });
});

// === ROUTES PROTÉGÉES ===

// Profil utilisateur
app.get('/profile', isAuthenticated, (req, res) => {
  res.status(200).json({
    isLoggedIn: true,
    user: { id: req.session.userId, username: req.session.username }
  });
});

// === ROUTES DES FAVORIS (PROTÉGÉES) ===

// Obtenir tous les favoris de l'utilisateur
app.get('/api/favorites', isAuthenticated, async (req, res) => {
  try {
    const favorites = await db.all('SELECT * FROM favorites WHERE user_id = ?', [req.session.userId]);
    res.status(200).json(favorites);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des favoris.' });
  }
});

// Ajouter un favori
app.post('/api/favorites', isAuthenticated, async (req, res) => {
  const { joke_id, joke_text } = req.body;
  if (!joke_id || !joke_text) {
    return res.status(400).json({ message: 'ID et texte de la blague requis.' });
  }

  try {
    // Vérifier si le favori existe déjà pour cet utilisateur
    const existing = await db.get('SELECT * FROM favorites WHERE user_id = ? AND joke_id = ?', [req.session.userId, joke_id]);
    if (existing) {
      return res.status(409).json({ message: 'Cette blague est déjà dans vos favoris.' });
    }

    const result = await db.run(
      'INSERT INTO favorites (user_id, joke_id, joke_text) VALUES (?, ?, ?)',
      [req.session.userId, joke_id, joke_text]
    );
    res.status(201).json({ message: 'Favori ajouté avec succès.', favoriteId: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout du favori.' });
  }
});

// Supprimer un favori
app.delete('/api/favorites/:joke_id', isAuthenticated, async (req, res) => {
  const { joke_id } = req.params;
  try {
    const result = await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND joke_id = ?',
      [req.session.userId, joke_id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Favori non trouvé ou non autorisé à supprimer.' });
    }

    res.status(200).json({ message: 'Favori supprimé avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression du favori.' });
  }
});
