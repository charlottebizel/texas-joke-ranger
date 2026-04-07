<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Favorites - Texas Joke Ranger</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <header>
        <nav class="navbar">
            <a href="/" class="nav-logo">TEXAS JOKE RANGER</a>
            <ul class="nav-menu">
                <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
                <li class="nav-item"><a href="/jokes" class="nav-link">Jokes</a></li>
                <li class="nav-item"><a href="/favorites" class="nav-link">Favorites</a></li>
            </ul>
            <div id="user-session">
                <span>Hello, <?= htmlspecialchars($user ?? '') ?></span>
                <a href="/logout"><button id="logout-btn" class="btn">Logout</button></a>
            </div>
        </nav>
    </header>

    <main>
        <h2>Your Favorites</h2>
        <div id="favorites-list">
            <?php if (!empty($favorites)): ?>
                <?php foreach ($favorites as $fav): ?>
                    <div class="favorite-item">
                        <p><?= htmlspecialchars($fav['joke_text']) ?></p>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <p>You have no favorites yet.</p>
            <?php endif; ?>
        </div>
    </main>

    <script src="/js/app.js"></script>
</body>
</html>