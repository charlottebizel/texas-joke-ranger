document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.splide')) new Splide('.splide').mount();

    const modal = document.getElementById('joke-modal');
    const modalText = document.getElementById('modal-joke-text');

    // Modal & Copy
    document.querySelectorAll('.splide__slide').forEach(slide => {
        slide.addEventListener('click', (e) => {
            if (e.target.classList.contains('fav-btn')) return;
            modalText.textContent = slide.dataset.jokeText;
            modal.style.display = 'block';
        });
    });

    window.addEventListener('click', e => {
        if (e.target === modal || e.target.classList.contains('close-btn')) modal.style.display = 'none';
    });

    document.getElementById('copy-joke-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(modalText.textContent);
        Toastify({text: "Copied!", style: {background: "green"}}).showToast();
    });

    // Favorites
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const { jokeId, jokeText, isFav } = btn.dataset;
            const token = await fetch('/csrf-token').then(r => r.json()).then(d => d.csrfToken);

            if (isFav === 'true') {
                await fetch(`/api/favorites/${jokeId}`, { method: 'DELETE', headers: { 'x-csrf-token': token }});
                btn.textContent = '☆ Add to Favorites';
                btn.dataset.isFav = 'false';
                btn.classList.remove('fav-btn--active');
            } else {
                await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
                    body: JSON.stringify({ joke_id: jokeId, joke_text: jokeText })
                });
                btn.textContent = '★ Saved';
                btn.dataset.isFav = 'true';
                btn.classList.add('fav-btn--active');
            }
        });
    });
});
