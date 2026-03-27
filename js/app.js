// This class handles all the main UI stuff
class SiteUI {
  // Selects all necessary DOM elements and initializes all UI components
  constructor() {
    this.hamburger = document.querySelector('.hamburger');
    this.navMenu = document.querySelector('.nav-menu');
    this.tabItems = document.querySelectorAll('.tab-item');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    this.backToTopBtn = document.getElementById('back-to-top');
    this.jokesContainer = document.getElementById('jokes-container');
    this.jokesList = document.getElementById('jokes-list');
    this.refreshJokesBtn = document.getElementById('refresh-jokes');

    this.init();
  }

  // Initializes all UI components
  init() {
    this.initHamburger();
    this.initTabs();
    this.initBackToTop();
    this.checkSession();
    this.initJokes();
  }

  // Sets up the joke-fetching on the homepage
  initJokes() {
    if (!this.jokesContainer) return;

    this.refreshJokesBtn.addEventListener('click', () => this.fetchAndShowJokes());
    this.fetchAndShowJokes();
  }

  // Fetches and displays random jokes
  async fetchAndShowJokes() {
    this.jokesList.innerHTML = '<p>Loading jokes...</p>';
    try {
      const jokePromises = [];
      // Fetch 3 jokes in parallel for better performance.
      for (let i = 0; i < 3; i++) {
        jokePromises.push(fetch('https://api.chucknorris.io/jokes/random').then(res => res.json()));
      }
      const jokes = await Promise.all(jokePromises);

      this.jokesList.innerHTML = ''; // Clear the loading message.
      jokes.forEach(joke => {
        const jokeElement = document.createElement('p');
        jokeElement.className = 'joke-item';
        jokeElement.textContent = joke.value;
        this.jokesList.appendChild(jokeElement);
      });
    } catch (err) {
      this.jokesList.innerHTML = '<p>Could not fetch jokes. Please try again later.</p>';
      console.error('Failed to fetch jokes:', err);
    }
  }

  // Initializes the hamburger menu for mobile
  initHamburger() {
    if (!this.hamburger || !this.navMenu) return;

    this.hamburger.addEventListener('click', () => {
      this.hamburger.classList.toggle('active');
      this.navMenu.classList.toggle('active');
    });

    // Close the menu when a navigation link is clicked.
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        this.hamburger.classList.remove('active');
        this.navMenu.classList.remove('active');
      });
    });
  }

  // Initializes the tab system
  initTabs() {
    if (!this.tabItems.length) return;

    this.tabItems.forEach(item => {
      item.addEventListener('click', () => {
        const tabId = item.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  }

  // Hides all tab panes and shows only the active one
  switchTab(tabId) {
    this.tabItems.forEach(item => item.classList.remove('active'));
    this.tabPanes.forEach(pane => pane.classList.remove('active'));

    const activeItem = document.querySelector(`.tab-item[data-tab="${tabId}"]`);
    const activePane = document.querySelector(`.tab-pane[data-tab="${tabId}"]`);

    if (activeItem) activeItem.classList.add('active');
    if (activePane) activePane.classList.add('active');
  }

  // Initializes the "back to top" button
  initBackToTop() {
    if (!this.backToTopBtn) return;

    window.addEventListener('scroll', () => {
      // Show the button only when the user has scrolled down a bit.
      this.backToTopBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
    });

    this.backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Checks if a user is logged in and updates the UI
  async checkSession() {
    const userSession = document.getElementById('user-session');
    if (!userSession) return;

    try {
      const res = await fetch('/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.isLoggedIn) {
          this.showLogout(userSession, data.user.username);
        }
      }
    } catch (err) {
      console.error('Session error:', err);
    }
  }

  // Renders a welcome message and a logout button
  showLogout(container, username) {
    container.innerHTML = '';

    const welcomeText = document.createElement('span');
    welcomeText.textContent = `Hello, ${username}`;

    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Logout';

    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/logout');
        window.location.href = '/index.html'; // Redirect to home on logout.
      } catch (err) {
        console.error('Logout error:', err);
      }
    });

    container.appendChild(welcomeText);
    container.appendChild(logoutBtn);
  }
}

// Instantiate the SiteUI class once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
  new SiteUI();
});
