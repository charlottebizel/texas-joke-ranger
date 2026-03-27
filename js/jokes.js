/**
 * @file Manages the interactive elements on the jokes page.
 * @description Handles the Splide carousel, joke modal, and Add to Favorites feature.
 */

document.addEventListener('DOMContentLoaded', () => {

    // Initialize the Splide carousel
    if (document.querySelector('.splide')) {
        new Splide('.splide').mount();
    }

    // Modal elements
    const modal = document.getElementById('joke-modal');
    const modalJokeText = document.getElementById('modal-joke-text');
    const closeBtn = document.querySelector('.close-btn');
    const copyBtn = document.getElementById('copy-joke-btn');

    // Open modal when clicking a slide (but not the fav button)
    document.querySelectorAll('.splide__slide').forEach(slide => {
        slide.addEventListener('click', (e) => {
            if (e.target.classList.contains('fav-btn')) return;
            const jokeText = slide.dataset.jokeText;
            modalJokeText.textContent = jokeText;
            modal.style.display = 'block';
        });
    });

    // Close modal with X button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Copy joke to clipboard
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(modalJokeText.textContent).then(() => {
                alert('Joke copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    }

    // Close modal clicking outside
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // === FAVORITES FEATURE ===

    /**
     * Retrieves a fresh CSRF token from the server.
     * @returns {Promise<string|null>} The CSRF token or null on failure.
     */
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

    /**
     * Shows a toast notification.
     * @param {string} message - The message to display.
     * @param {string} color - Background color of the toast.
     */
    function showToast(message, color = '#b30000') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: { background: color }
        }).showToast();
    }

    // Handle Add/Remove favorite button clicks
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();

            const jokeId = btn.dataset.jokeId;
            const jokeText = btn.dataset.jokeText;
            const isFav = btn.dataset.isFav === 'true';

            const csrfToken = await getCsrfToken();
            if (!csrfToken) {
                showToast('Session error, please refresh.');
                return;
            }

            if (isFav) {
                // Remove from favorites
                try {
                    const res = await fetch(`/api/favorites/${jokeId}`, {
                        method: 'DELETE',
                        headers: { 'x-csrf-token': csrfToken }
                    });
                    if (res.ok) {
                        btn.textContent = '☆ Add to Favorites';
                        btn.dataset.isFav = 'false';
                        btn.classList.remove('fav-btn--active');
                        showToast('Removed from favorites.', '#555');
                    } else {
                        showToast('Could not remove favorite.');
                    }
                } catch (err) {
                    showToast('Server error.');
                }
            } else {
                // Add to favorites
                try {
                    const res = await fetch('/api/favorites', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-csrf-token': csrfToken
                        },
                        body: JSON.stringify({ joke_id: jokeId, joke_text: jokeText })
                    });
                    if (res.ok) {
                        btn.textContent = '★ Saved';
                        btn.dataset.isFav = 'true';
                        btn.classList.add('fav-btn--active');
                        showToast('Added to favorites! ⭐', '#b8860b');
                    } else {
                        const data = await res.json();
                        showToast(data.message || 'Could not add favorite.');
                    }
                } catch (err) {
                    showToast('Server error.');
                }
            }
        });
    });
});
