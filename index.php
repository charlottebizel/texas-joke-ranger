<?php
require_once __DIR__ . '/Database.php';

use App\Config\Database;

// === 1. CONFIGURATION ET SESSIONS ===
$isProduction = false; // Passer à true en production

session_set_cookie_params([
    'lifetime' => 3600,
    'path' => '/',
    'domain' => '',
    'secure' => $isProduction, 
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_start();

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    setcookie('csrf-token', $_SESSION['csrf_token'], time() + 3600, '/', '', $isProduction, true);
}

// === 2. ROUTAGE ET MIDDLEWARES ===
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Middleware : Protection CSRF globale
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    $csrfHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $csrfCookie = $_COOKIE['csrf-token'] ?? '';

    if (!$csrfHeader || !$csrfCookie || $csrfHeader !== $csrfCookie || $csrfHeader !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['message' => 'Action non autorisée (Token CSRF invalide).']);
        exit;
    }
}

// Middleware : Body Parser (Remplacement de express.json())
$jsonBody = json_decode(file_get_contents('php://input'), true);

// Connexion base de données
$db = (new Database())->getConnection();

// Utilitaires
function isAuthenticated() { return isset($_SESSION['userId']); }
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Identification des paramètres d'URL dynamique (ex: /api/favorites/:joke_id)
if (preg_match('#^/api/favorites/([0-9a-zA-Z_-]+)$#', $uri, $matches)) {
    $uri = '/api/favorites/{id}';
    $jokeId = $matches[1];
}

// === 3. DÉCLARATION DES ROUTES ===
switch ("$method $uri") {

    // --- ROUTES SÉCURITÉ ---
    case 'GET /csrf-token':
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        setcookie('csrf-token', $token, time() + 3600, '/', '', $isProduction, true);
        jsonResponse(['csrfToken' => $token]);

    // --- ROUTES AUTHENTIFICATION ---
    case 'POST /register':
        $username = $jsonBody['username'] ?? '';
        $password = $jsonBody['password'] ?? '';
        
        if (!$username || !$password) jsonResponse(['message' => 'Requis : Username & Password.'], 400);
        
        $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) jsonResponse(['message' => 'Ce nom d\'utilisateur est déjà pris.'], 409);
        
        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        if ($stmt->execute([$username, $hashed])) {
            jsonResponse(['message' => 'Utilisateur créé.', 'userId' => $db->lastInsertId()], 201);
        }
        jsonResponse(['message' => 'Erreur serveur.'], 500);

    case 'POST /login':
        $username = $jsonBody['username'] ?? '';
        $password = $jsonBody['password'] ?? '';
        
        if (!$username || !$password) jsonResponse(['message' => 'Requis : Username & Password.'], 400);
        
        $stmt = $db->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password'])) {
            jsonResponse(['message' => 'Identifiants invalides.'], 401);
        }
        
        session_regenerate_id(true); // Protection Fixation Session
        $_SESSION['userId'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        setcookie('csrf-token', $token, time() + 3600, '/', '', $isProduction, true);
        
        jsonResponse([
            'message' => 'Connexion réussie.',
            'user' => ['id' => $user['id'], 'username' => $user['username']],
            'redirect' => '/jokes'
        ]);

    case 'GET /logout':
        session_destroy();
        setcookie(session_name(), '', time() - 3600, '/');
        setcookie('csrf-token', '', time() - 3600, '/');
        header('Location: /auth.html');
        exit;

    case 'GET /profile':
        if (!isAuthenticated()) jsonResponse(['isLoggedIn' => false], 401);
        jsonResponse(['isLoggedIn' => true, 'user' => ['id' => $_SESSION['userId'], 'username' => $_SESSION['username']]]);

    // --- ROUTES API FAVORIS ---
    case 'GET /api/favorites':
        if (!isAuthenticated()) jsonResponse(['message' => 'Non autorisé.'], 401);
        $stmt = $db->prepare('SELECT * FROM favorites WHERE user_id = ?');
        $stmt->execute([$_SESSION['userId']]);
        jsonResponse($stmt->fetchAll());

    case 'POST /api/favorites':
        if (!isAuthenticated()) jsonResponse(['message' => 'Non autorisé.'], 401);
        $joke_id = $jsonBody['joke_id'] ?? '';
        $joke_text = $jsonBody['joke_text'] ?? '';
        
        if (!$joke_id || !$joke_text) jsonResponse(['message' => 'ID de la blague et texte requis.'], 400);
        
        $stmt = $db->prepare('SELECT id FROM favorites WHERE user_id = ? AND joke_id = ?');
        $stmt->execute([$_SESSION['userId'], $joke_id]);
        if ($stmt->fetch()) jsonResponse(['message' => 'Déjà dans les favoris.'], 409);
        
        $stmt = $db->prepare('INSERT INTO favorites (user_id, joke_id, joke_text) VALUES (?, ?, ?)');
        if ($stmt->execute([$_SESSION['userId'], $joke_id, $joke_text])) {
            jsonResponse(['message' => 'Favori ajouté.', 'favoriteId' => $db->lastInsertId()], 201);
        }
        jsonResponse(['message' => 'Erreur lors de l\'ajout.'], 500);

    case 'DELETE /api/favorites/{id}':
        if (!isAuthenticated()) jsonResponse(['message' => 'Non autorisé.'], 401);
        $stmt = $db->prepare('DELETE FROM favorites WHERE user_id = ? AND joke_id = ?');
        $stmt->execute([$_SESSION['userId'], $jokeId]);
        
        if ($stmt->rowCount() === 0) jsonResponse(['message' => 'Favori introuvable.'], 404);
        jsonResponse(['message' => 'Favori supprimé.']);

    // --- ROUTES VUES HTML ---
    case 'GET /jokes':
    case 'GET /favorites':
        if (!isAuthenticated()) {
            header('Location: /auth.html');
            exit;
        }
        
        $stmt = $db->prepare('SELECT * FROM favorites WHERE user_id = ?');
        $stmt->execute([$_SESSION['userId']]);
        $favorites = $stmt->fetchAll();
        $user = $_SESSION['username'];
        
        // Récupération des 10 blagues pour la vue (imite le comportement de server.js)
        $jokes = [];
        if ($uri === '/jokes') {
            // Configuration pour ignorer les erreurs de certificat SSL en local
            $context = stream_context_create([
                "ssl" => [
                    "verify_peer" => false,
                    "verify_peer_name" => false,
                ]
            ]);
            for ($i = 0; $i < 10; $i++) {
                $response = @file_get_contents('https://api.chucknorris.io/jokes/random', false, $context);
                if ($response) {
                    $jokes[] = json_decode($response, true);
                }
            }
        }

        // Charge le bon fichier .php selon la route
        $viewFile = ($uri === '/jokes') ? 'jokes.php' : 'favorites.php';
        require __DIR__ . '/views/' . $viewFile;
        break;

    case 'GET /':
        // Redirection de la racine vers la page d'accueil (comme Node.js)
        $fileToServe = is_file(__DIR__ . '/index.html') ? '/index.html' : '/auth.html';
        header('Content-Type: text/html');
        readfile(__DIR__ . $fileToServe);
        exit;

    default:
        // --- SERVEUR DE FICHIERS STATIQUES ---
        $filePath = __DIR__ . $uri;
        if (is_file($filePath)) {
            // Ajout des types MIME pour que le CSS et le JS chargent correctement
            $ext = pathinfo($filePath, PATHINFO_EXTENSION);
            $mimeTypes = [
                'css' => 'text/css', 'js' => 'application/javascript',
                'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
                'gif' => 'image/gif', 'svg' => 'image/svg+xml', 'html' => 'text/html'
            ];
            if (isset($mimeTypes[$ext])) header('Content-Type: ' . $mimeTypes[$ext]);

            // Retourne un fichier CSS, JS, ou HTML s'il existe (imite express.static)
            readfile($filePath);
            exit;
        }

        http_response_code(404);
        echo "404 Page introuvable.";
        break;
}