const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function setupDatabase() {
  try {
    const db = await open({
      filename: './db.sqlite',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        joke_id TEXT NOT NULL,
        joke_text TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);

    console.log('Base de données et tables créées avec succès.');
    await db.close();
  } catch (err) {
    console.error('Erreur lors de la création de la base de données:', err.message);
  }
}

setupDatabase();
