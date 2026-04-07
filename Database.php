<?php
namespace App\Config;

use PDO;
use PDOException;

/**
 * Classe gérant la connexion à la base de données SQLite
 */
class Database {
    private $pdo;

    public function __construct() {
        // Chemin corrigé : le fichier SQLite est dans le même dossier
        $dbPath = __DIR__ . '/db.sqlite';
        
        try {
            $this->pdo = new PDO("sqlite:" . $dbPath);
            // Activer le mode d'erreur strict pour faciliter le débogage (identique à throw en JS)
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Retourner les données sous forme de tableaux associatifs par défaut
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Affiche l'erreur exacte pour comprendre ce qui cloche (utile en mode développement)
            die("Erreur de connexion à la base de données : " . $e->getMessage());
        }
    }

    public function getConnection(): PDO {
        return $this->pdo;
    }
}
?>