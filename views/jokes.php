<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jokes - Texas Joke Ranger</title>
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
        <h2>Jokes Generator</h2>
        <div id="jokes-container">
            <div id="jokes-list">
                <?php if (!empty($jokes)): ?>
                    <?php foreach ($jokes as $joke): ?>
                        <p class="joke-item"><?= htmlspecialchars($joke['value']) ?></p>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p>No jokes found.</p>
                <?php endif; ?>
            </div>
            <button id="refresh-jokes" class="btn">Get new jokes</button>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
    <script src="/js/app.js"></script>
</body>
</html>