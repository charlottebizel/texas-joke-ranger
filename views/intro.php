<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Document metadata and styling for the intro animation -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>R.I.P. Chuck Norris</title>
    <link rel="stylesheet" href="/css/style.css">
    <link href="https://fonts.cdnfonts.com/css/western" rel="stylesheet">
</head>
<body class="intro-body">
    <!-- Main container for the animated text and image -->
    <div class="intro-container">
        <img src="/assets/chuck-norris.png" alt="Chuck Norris" class="intro-image">
        <h1 class="ml1">
            <span class="text-wrapper">
              <span class="line line1"></span>
              <span class="letters">R.I.P. Chuck Norris</span>
              <span class="line line2"></span>
            </span>
          </h1>
        <h2>1940 - ∞</h2>
    </div>

    <!-- Anime.js library for text animation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    <script>
        // Automatically redirect the user to the home page after 4 seconds
        setTimeout(() => { window.location.href = '/'; }, 4000);
    </script>
</body>
</html>