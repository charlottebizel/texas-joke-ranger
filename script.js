class KaamelottApp {
  constructor() {
    this.apiUrl = 'https://kaamelott-api.herokuapp.com/api/random';
    this.quotes = [];
    this.init();
  }

  init() {
    this.fetchQuotes(5); // Charger 5 citations
    this.setupHamburger();
    this.setupThemeToggle();
    this.setupSearch();
    this.setupModal();
  }

  async fetchQuotes(count) {
    for (let i = 0; i < count; i++) {
      try {
        const res = await fetch(this.apiUrl);
        const data = await res.json();
        this.quotes.push(data);
      } catch(err) {
        console.error("Erreur API :", err);
      }
    }
    this.renderCarousel();
  }

  renderCarousel() {
    const list = document.getElementById('quote-list');
    list.innerHTML = '';
    this.quotes.forEach(q => {
      const li = document.createElement('li');
      li.className = 'splide__slide';
      li.textContent = q.quote;
      li.addEventListener('click', () => this.openModal(q));
      list.appendChild(li);
    });

    new Splide('#carousel', { type: 'loop', perPage: 1, autoplay: true }).mount();
  }

  setupHamburger() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav-menu');
    hamburger.addEventListener('click', () => nav.classList.toggle('open'));
  }

  setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      btn.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    });
  }

  setupSearch() {
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', (e) => {
      const filtered = this.quotes.filter(q => q.quote.toLowerCase().includes(e.target.value.toLowerCase()));
      this.renderFiltered(filtered);
    });
  }

  renderFiltered(filtered) {
    const list = document.getElementById('quote-list');
    list.innerHTML = '';
    filtered.forEach(q => {
      const li = document.createElement('li');
      li.className = 'splide__slide';
      li.textContent = q.quote;
      li.addEventListener('click', () => this.openModal(q));
      list.appendChild(li);
    });
  }

  setupModal() {
    this.modal = document.getElementById('quote-modal');
    this.modalText = document.getElementById('modal-text');
    const closeBtn = this.modal.querySelector('.close');
    closeBtn.addEventListener('click', () => this.modal.style.display = 'none');

    document.getElementById('copy-quote').addEventListener('click', () => {
      navigator.clipboard.writeText(this.modalText.textContent);
      Toastify({ text: "Citation copiée !", duration: 2000, gravity: "top", position: "right" }).showToast();
    });
  }

  openModal(quote) {
    this.modalText.textContent = `"${quote.quote}" - ${quote.character}`;
    this.modal.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => new KaamelottApp());