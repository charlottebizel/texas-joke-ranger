<?php
// Initialisation sécurisée de la session (Remplacement de express-session)
session_set_cookie_params([
    'lifetime' => 3600,
    'path' => '/',
    'domain' => '',
    'secure' => true, // Correspond à isProduction dans votre JS
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_start();

// Protection CSRF basique : Génération d'un token s'il n'existe pas
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32)); // Remplacement de crypto.randomBytes
    // Configuration du cookie CSRF pour le JavaScript front-end
    setcookie('csrf-token', $_SESSION['csrf_token'], time() + 3600, '/', '', true, true);
}

// Exemple de routage simple (Contrôleur frontal)
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($uri === '/jokes' && isset($_SESSION['userId'])) {
    // L'utilisateur est connecté, on charge la vue des blagues
    require 'views/jokes.php';
} else {
    require 'views/auth.php';
}
?>