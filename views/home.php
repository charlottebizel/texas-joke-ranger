<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Texas Joke Ranger</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
    <link href="https://fonts.cdnfonts.com/css/western" rel="stylesheet">
</head>
<body>
    <header>
        <nav class="navbar">
            <a href="/" class="nav-logo">TEXAS JOKE RANGER</a>
            <ul class="nav-menu">
                <li class="nav-item"><a href="/" class="nav-link">Home</a></li>
                <li class="nav-item"><a href="/jokes" class="nav-link">Jokes</a></li>
                <?php if (isset($_SESSION['userId'])): ?>
                    <li class="nav-item"><a href="/favorites" class="nav-link">⭐ Favorites</a></li>
                <?php else: ?>
                    <li class="nav-item"><a href="/auth" class="nav-link">Login</a></li>
                <?php endif; ?>
            </ul>
            <div class="hamburger">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </div>
            <div id="user-session">
                <?php if (isset($_SESSION['userId'])): ?>
                    <span>Hello, <?= htmlspecialchars($_SESSION['username']) ?></span>
                    <a href="/logout"><button class="btn">Logout</button></a>
                <?php endif; ?>
            </div>
        </nav>
    </header>

    <main>
        <div class="tabs">
            <div class="tab-header">
                <div class="tab-item active" data-tab="1">WELCOME</div>
                <div class="tab-item" data-tab="2">ABOUT</div>
                <div class="tab-item" data-tab="3">R.I.P</div>
            </div>
            <div class="tab-content">
                <div class="tab-pane active" id="tab1" data-tab="1">
                    <h2>Welcome to the Chuck Norris Joke Generator App</h2>
                    <p>Chuck Never Laughs, but you will.</p>

                    <div id="jokes-container">
                        <h3>Some random jokes</h3>
                        <div id="jokes-list"></div>
                        <button id="refresh-jokes" class="btn">Get new jokes</button>
                    </div>
                </div>
                <div class="tab-pane" id="tab2" data-tab="2">
                    <p>Discover legendary jokes and absurd facts inspired by Chuck Norris himself. </p>
                    <p>Generate jokes and dive into the universe of one of the most iconic figures of all time.</p>
                    <a href="/jokes" class="btn">Start the Jokes Generator</a>
                </div>
                <div class="tab-pane" id="tab3" data-tab="3">
                    <h2 id="tab3-title">R.I.P </h2>
                    <p id="tab3-text">Chuck Norris doesn't die... he just rests.</p>
                </div>
            </div>
        </div>
    </main>

    <footer>
        <p>&copy; 2026 Texas Joke Ranger</p>
    </footer>

    <button id="back-to-top">^</button>

    <script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
    <script src="/js/app.js"></script>
</body>
</html>