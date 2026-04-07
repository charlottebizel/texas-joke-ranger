document.addEventListener('DOMContentLoaded', () => {
    // Menu Hamburger
    document.querySelector('.hamburger')?.addEventListener('click', function() {
        this.classList.toggle('active');
        document.querySelector('.nav-menu').classList.toggle('active');
    });

    // Onglets (Tabs)
    document.querySelectorAll('.tab-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.tab-item, .tab-pane').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            document.getElementById('tab' + item.dataset.tab).classList.add('active');
        });
    });

    // Bouton Retour en haut
    const btn = document.getElementById('back-to-top');
    if (btn) {
        window.addEventListener('scroll', () => btn.style.display = window.scrollY > 200 ? 'block' : 'none');
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Blagues de la page d'accueil
    const refreshBtn = document.getElementById('refresh-jokes');
    if (refreshBtn) {
        const fetchJokes = async () => {
            const list = document.getElementById('jokes-list');
            list.innerHTML = '<p>Loading...</p>';
            try {
                const jokes = await Promise.all([1,2,3].map(() => fetch('https://api.chucknorris.io/jokes/random').then(r => r.json())));
                list.innerHTML = jokes.map(j => `<p class="joke-item">${j.value}</p>`).join('');
            } catch {
                list.innerHTML = '<p>Error loading jokes.</p>';
            }
        };
        refreshBtn.addEventListener('click', fetchJokes);
        fetchJokes();
    }
});
