-- Début de la transaction pour assurer l'intégrité des opérations.
BEGIN TRANSACTION;

--
-- Structure de la table "users"
-- Stocke les informations d'identification des utilisateurs.
--
CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "username" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL
);

--
-- Structure de la table "favorites"
-- Stocke les blagues marquées comme favorites par les utilisateurs.
--
CREATE TABLE IF NOT EXISTS "favorites" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "joke_id" TEXT NOT NULL,
    "joke_text" TEXT NOT NULL,
    FOREIGN KEY("user_id") REFERENCES "users"("id")
);

-- Valide la transaction.
COMMIT;
