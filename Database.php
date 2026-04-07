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
        // Chemin vers votre fichier SQLite existant
        $dbPath = __DIR__ . '/../db.sqlite';
        
        try {
            $this->pdo = new PDO("sqlite:" . $dbPath);
            // Activer le mode d'erreur strict pour faciliter le débogage (identique à throw en JS)
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Retourner les données sous forme de tableaux associatifs par défaut
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // En production, on évite d'afficher l'erreur brute pour des raisons de sécurité
            die("Erreur de connexion à la base de données.");
        }
    }

    public function getConnection(): PDO {
        return $this->pdo;
    }
}
?>