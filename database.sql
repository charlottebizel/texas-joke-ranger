-- Start of transaction to ensure operational integrity.
BEGIN TRANSACTION;

--
-- Structure of the "users" table
-- Stores user authentication information.
--
CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "username" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL
);

--
-- Structure of the "favorites" table
-- Stores the jokes marked as favorites by users.
--
CREATE TABLE IF NOT EXISTS "favorites" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "joke_id" TEXT NOT NULL,
    "joke_text" TEXT NOT NULL,
    FOREIGN KEY("user_id") REFERENCES "users"("id")
);

-- Commit the transaction.
COMMIT;
