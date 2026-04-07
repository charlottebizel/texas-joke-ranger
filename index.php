<?php
require_once __DIR__ . '/Database.php';

use App\Config\Database;

// === 1. CONFIGURATION AND SESSIONS ===
$isProduction = false; // Set to true in production

session_set_cookie_params(['lifetime' => 3600, 'path' => '/', 'secure' => $isProduction, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// === 2. ROUTING AND MIDDLEWARES ===
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Middleware: Global CSRF Protection
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    $csrfHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if (!$csrfHeader || $csrfHeader !== $_SESSION['csrf_token']) {
        http_response_code(403);
        echo json_encode(['message' => 'Invalid CSRF token.']);
        exit;
    }
}

// Middleware: Body Parser (express.json() replacement)
$jsonBody = json_decode(file_get_contents('php://input'), true);

// Database connection
$db = (new Database())->getConnection();

// Utilities
function isAuthenticated() { return isset($_SESSION['userId']); }
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Dynamic URL parameter identification (e.g., /api/favorites/:joke_id)
if (preg_match('#^/api/favorites/([0-9a-zA-Z_-]+)$#', $uri, $matches)) {
    $uri = '/api/favorites/{id}';
    $jokeId = $matches[1];
}

// === 3. ROUTES DECLARATION ===
switch ("$method $uri") {

    // --- SECURITY ROUTES ---
    case 'GET /csrf-token':
        jsonResponse(['csrfToken' => $_SESSION['csrf_token']]);

    // --- AUTHENTICATION ROUTES ---
    case 'POST /register':
        $username = $jsonBody['username'] ?? '';
        $password = $jsonBody['password'] ?? '';
        
        if (!$username || !$password) jsonResponse(['message' => 'Required: Username & Password.'], 400);
        
        $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        if ($stmt->fetch()) jsonResponse(['message' => 'This username is already taken.'], 409);
        
        $hashed = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        if ($stmt->execute([$username, $hashed])) {
            jsonResponse(['message' => 'User created.', 'userId' => $db->lastInsertId()], 201);
        }
        jsonResponse(['message' => 'Server error.'], 500);

    case 'POST /login':
        $username = $jsonBody['username'] ?? '';
        $password = $jsonBody['password'] ?? '';
        
        if (!$username || !$password) jsonResponse(['message' => 'Required: Username & Password.'], 400);
        
        $stmt = $db->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password'])) {
            jsonResponse(['message' => 'Invalid credentials.'], 401);
        }
        
        session_regenerate_id(true); // Session Fixation Protection
        $_SESSION['userId'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        
        jsonResponse([
            'message' => 'Login successful.',
            'user' => ['id' => $user['id'], 'username' => $user['username']],
            'redirect' => '/jokes'
        ]);

    case 'GET /logout':
        session_destroy();
        setcookie(session_name(), '', time() - 3600, '/');
        header('Location: /auth');
        exit;

    case 'GET /profile':
        if (!isAuthenticated()) jsonResponse(['isLoggedIn' => false], 401);
        jsonResponse(['isLoggedIn' => true, 'user' => ['id' => $_SESSION['userId'], 'username' => $_SESSION['username']]]);

    // --- FAVORITES API ROUTES ---
    case 'GET /api/favorites':
        if (!isAuthenticated()) jsonResponse(['message' => 'Unauthorized.'], 401);
        $stmt = $db->prepare('SELECT * FROM favorites WHERE user_id = ?');
        $stmt->execute([$_SESSION['userId']]);
        jsonResponse($stmt->fetchAll());

    case 'POST /api/favorites':
        if (!isAuthenticated()) jsonResponse(['message' => 'Unauthorized.'], 401);
        $joke_id = $jsonBody['joke_id'] ?? '';
        $joke_text = $jsonBody['joke_text'] ?? '';
        
        if (!$joke_id || !$joke_text) jsonResponse(['message' => 'Joke ID and text required.'], 400);
        
        $stmt = $db->prepare('SELECT id FROM favorites WHERE user_id = ? AND joke_id = ?');
        $stmt->execute([$_SESSION['userId'], $joke_id]);
        if ($stmt->fetch()) jsonResponse(['message' => 'Already in favorites.'], 409);
        
        $stmt = $db->prepare('INSERT INTO favorites (user_id, joke_id, joke_text) VALUES (?, ?, ?)');
        if ($stmt->execute([$_SESSION['userId'], $joke_id, $joke_text])) {
            jsonResponse(['message' => 'Favorite added.', 'favoriteId' => $db->lastInsertId()], 201);
        }
        jsonResponse(['message' => 'Error while adding.'], 500);

    case 'DELETE /api/favorites/{id}':
        if (!isAuthenticated()) jsonResponse(['message' => 'Unauthorized.'], 401);
        $stmt = $db->prepare('DELETE FROM favorites WHERE user_id = ? AND joke_id = ?');
        $stmt->execute([$_SESSION['userId'], $jokeId]);
        
        if ($stmt->rowCount() === 0) jsonResponse(['message' => 'Favorite not found.'], 404);
        jsonResponse(['message' => 'Favorite deleted.']);

    // --- HTML VIEWS ROUTES ---
    case 'GET /jokes':
    case 'GET /favorites':
        if (!isAuthenticated()) {
            header('Location: /auth');
            exit;
        }
        
        $stmt = $db->prepare('SELECT * FROM favorites WHERE user_id = ?');
        $stmt->execute([$_SESSION['userId']]);
        $favorites = $stmt->fetchAll();
        $user = $_SESSION['username'];
        
        // Fetching 10 jokes for the view (mimics server.js behavior)
        $jokes = [];
        if ($uri === '/jokes') {
            // Configuration to ignore SSL certificate errors locally
            $context = stream_context_create(["ssl" => ["verify_peer" => false, "verify_peer_name" => false]]);
            for ($i = 0; $i < 10; $i++) {
                $response = @file_get_contents('https://api.chucknorris.io/jokes/random', false, $context);
                if ($response) {
                    $jokes[] = json_decode($response, true);
                }
            }
        }

        // Load the correct .php file based on the route
        $viewFile = ($uri === '/jokes') ? 'jokes.php' : 'favorites.php';
        require __DIR__ . '/views/' . $viewFile;
        break;

    case 'GET /':
        require __DIR__ . '/views/home.php';
        break;

    case 'GET /auth':
    case 'GET /auth.html': // Keep the old route valid just in case
        require __DIR__ . '/views/auth.php';
        break;

    case 'GET /intro':
    case 'GET /intro.html':
        require __DIR__ . '/views/intro.php';
        break;

    default:
        // --- STATIC FILE SERVER ---
        $filePath = __DIR__ . $uri;
        if (is_file($filePath)) {
            // Adding MIME types so CSS and JS load correctly
            $ext = pathinfo($filePath, PATHINFO_EXTENSION);
            $mimeTypes = [
                'css' => 'text/css', 'js' => 'application/javascript',
                'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
                'gif' => 'image/gif', 'svg' => 'image/svg+xml', 'html' => 'text/html'
            ];
            if (isset($mimeTypes[$ext])) header('Content-Type: ' . $mimeTypes[$ext]);

            // Returns a CSS, JS, or HTML file if it exists (mimics express.static)
            readfile($filePath);
            exit;
        }

        http_response_code(404);
        echo "404 Page not found.";
        break;
}