<?php
namespace App\Config;

use PDO;
use PDOException;

/**
 * Class managing the connection to the SQLite database
 */
class Database {
    private $pdo;

    public function __construct() {
        // Corrected path: the SQLite file is in the same folder
        $dbPath = __DIR__ . '/db.sqlite';
        
        try {
            $this->pdo = new PDO("sqlite:" . $dbPath);
            // Enable strict error mode for easier debugging (similar to throw in JS)
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Return data as associative arrays by default
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Display the exact error to understand what went wrong (useful in development mode)
            die("Database connection error: " . $e->getMessage());
        }
    }

    public function getConnection(): PDO {
        return $this->pdo;
    }
}
?>