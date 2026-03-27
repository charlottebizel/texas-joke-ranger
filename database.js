const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// This script sets up the database.
// Run it once with `node database.js` before starting the server.

// Connects to the database, creates tables, and then closes the connection.
async function setupDatabase() {
  try {
    // Open a connection to the SQLite database file.
    // The file will be created if it doesn't exist.
    const db = await open({
      filename: './db.sqlite',
      driver: sqlite3.Database
    });

    console.log('Connection to the database has been established.');

    // SQL statement to create the 'users' table.
    // It stores user credentials.
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    console.log('Table "users" created or already exists.');

    // SQL statement to create the 'favorites' table.
    // It stores the jokes that users have marked as favorites.
    await db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        joke_id TEXT NOT NULL,
        joke_text TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    
    console.log('Table "favorites" created or already exists.');
    
    console.log('Database and tables created successfully.');
    await db.close();
  } catch (err) {
    console.error('Error during database setup:', err.message);
  }
}

// Execute the setup function.
setupDatabase();
