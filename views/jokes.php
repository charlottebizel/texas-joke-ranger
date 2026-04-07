<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chuck Norris Jokes</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css">
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
        <div class="splide">
            <div class="splide__track">
                <ul class="splide__list">
                    <?php if (!empty($jokes)): ?>
                        <?php foreach ($jokes as $joke): ?>
                            <?php
                              // Check if this joke is already in favorites
                              $isFav = false;
                              if (!empty($favorites)) {
                                  foreach ($favorites as $f) {
                                      if ($f['joke_id'] === $joke['id']) {
                                          $isFav = true;
                                          break;
                                      }
                                  }
                              }
                            ?>
                            <li class="splide__slide"
                                data-joke-id="<?= htmlspecialchars($joke['id']) ?>"
                                data-joke-text="<?= htmlspecialchars($joke['value']) ?>">
                                <p><?= htmlspecialchars($joke['value']) ?></p>
                                <button class="btn fav-btn <?= $isFav ? 'fav-btn--active' : '' ?>"
                                        data-joke-id="<?= htmlspecialchars($joke['id']) ?>"
                                        data-joke-text="<?= htmlspecialchars($joke['value']) ?>"
                                        data-is-fav="<?= $isFav ? 'true' : 'false' ?>">
                                    <?= $isFav ? '★ Saved' : '☆ Add to Favorites' ?>
                                </button>
                            </li>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <li class="splide__slide"><p>Oops! No jokes retrieved. Did you enable OpenSSL and restart the server?</p></li>
                    <?php endif; ?>
                </ul>
            </div>
        </div>
    </main>

    <!-- Modal for displaying a single joke -->
    <div id="joke-modal" class="modal">
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <p id="modal-joke-text"></p>
            <button id="copy-joke-btn">Copy</button>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
    <script src="/js/jokes.js"></script>
</body>
</html>