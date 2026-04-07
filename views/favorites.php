<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Favorites - Texas Joke Ranger</title>
    <link rel="stylesheet" href="/css/style.css">
    <link href="https://fonts.cdnfonts.com/css/western" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
</head>
<body>
    <header>
        <nav class="navbar">
            <a href="/" class="nav-logo">TEXAS JOKE RANGER</a>
            <ul class="nav-menu">
                <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
                <li class="nav-item"><a href="/jokes" class="nav-link">Jokes</a></li>
                <li class="nav-item"><a href="/favorites" class="nav-link">⭐ Favorites</a></li>
            </ul>
            <div class="hamburger">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </div>
            <div id="user-session">
                <span>Hello, <?= htmlspecialchars($user ?? '') ?></span>
                <a href="/logout"><button id="logout-btn" class="btn">Logout</button></a>
            </div>
        </nav>
    </header>

    <main>
        <div class="favorites-container">
            <h1>Your Favorites</h1>
            <p class="favorites-subtitle">Here are the jokes you saved for later.</p>
            <?php if (!empty($favorites)): ?>
                <ul class="favorites-list">
                    <?php foreach ($favorites as $fav): ?>
                        <li class="favorite-card">
                            <p class="favorite-text"><?= htmlspecialchars($fav['joke_text']) ?></p>
                            <button class="btn-remove fav-btn fav-btn--active" 
                                    data-joke-id="<?= htmlspecialchars($fav['joke_id']) ?>" 
                                    data-joke-text="<?= htmlspecialchars($fav['joke_text']) ?>" 
                                    data-is-fav="true">Remove</button>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php else: ?>
                <p class="favorites-empty">You have no favorites yet.</p>
            <?php endif; ?>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
    <script src="/js/app.js"></script>
    <script src="/js/jokes.js"></script>
</body>
</html>