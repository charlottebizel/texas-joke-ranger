document.addEventListener('DOMContentLoaded', () => {

    // Retrieves a fresh CSRF token from the server
    async function getCsrfToken() {
        try {
            const res = await fetch('/csrf-token');
            const data = await res.json();
            return data.csrfToken;
        } catch (err) {
            console.error('Error fetching CSRF token:', err);
            return null;
        }
    }

    // Shows a toast notification
    function showToast(message, color = '#b30000') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: color }
        }).showToast();
    }

    // Handle Remove button clicks
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', async () => {
            const jokeId = btn.dataset.jokeId;

            const csrfToken = await getCsrfToken();
            if (!csrfToken) {
                showToast('Session error, please refresh.');
                return;
            }

            try {
                const res = await fetch(`/api/favorites/${jokeId}`, {
                    method: 'DELETE',
                    headers: { 'x-csrf-token': csrfToken }
                });

                if (res.ok) {
                    // Remove the card from the DOM with a smooth animation
                    const card = document.querySelector(`.favorite-card[data-joke-id="${jokeId}"]`);
                    if (card) {
                        card.style.transition = 'opacity 0.3s';
                        card.style.opacity = '0';
                        setTimeout(() => {
                            card.remove();
                            // Show empty message if no more favorites
                            const list = document.querySelector('.favorites-list');
                            if (list && list.children.length === 0) {
                                list.outerHTML = `
                                    <div class="favorites-empty">
                                        <p>You have no favorites yet.</p>
                                        <a href="/jokes" class="btn">Go get some jokes!</a>
                                    </div>`;
                            }
                        }, 300);
                    }
                    showToast('Removed from favorites.', '#555');
                } else {
                    showToast('Could not remove favorite.');
                }
            } catch (err) {
                showToast('Server error.');
            }
        });
    });
});
