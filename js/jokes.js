document.addEventListener('DOMContentLoaded', () => {
    const addToFavoritesButton = document.getElementById('add-to-favorites');
    const removeFromFavoritesButtons = document.querySelectorAll('.remove-from-favorites');
    const csrfToken = getCookie('csrf-token');

    if (addToFavoritesButton) {
        addToFavoritesButton.addEventListener('click', async () => {
            const jokeId = addToFavoritesButton.dataset.jokeId;
            const jokeText = document.getElementById('joke-text').textContent;

            try {
                const response = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken
                    },
                    body: JSON.stringify({ joke_id: jokeId, joke_text: jokeText })
                });

                if (response.ok) {
                    location.reload();
                } else {
                    const data = await response.json();
                    alert(data.message);
                }
            } catch (error) {
                console.error('Erreur:', error);
            }
        });
    }

    removeFromFavoritesButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const jokeId = button.dataset.jokeId;

            try {
                const response = await fetch(`/api/favorites/${jokeId}`, {
                    method: 'DELETE',
                    headers: {
                        'x-csrf-token': csrfToken
                    }
                });

                if (response.ok) {
                    location.reload();
                } else {
                    const data = await response.json();
                    alert(data.message);
                }
            } catch (error) {
                console.error('Erreur:', error);
            }
        });
    });

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
});
