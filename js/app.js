// This class handles all the main UI stuff
/**
 * @file app.js
 * @description Main application script handling the User Interface (UI).
 * It manages navigation, tabs, scrolling, user session state, and fetches jokes.
 */

class SiteUI {
  // Selects all necessary DOM elements and initializes all UI components
  /**
   * Initializes the SiteUI instance by selecting DOM elements
   * and launching the various initialization routines.
   */
  constructor() {
    // --- DOM Elements ---
    
    // Navigation
    this.hamburger = document.querySelector('.hamburger');
    this.navMenu = document.querySelector('.nav-menu');
    
    // Tabs
    this.tabItems = document.querySelectorAll('.tab-item');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    
    // Utilities
    this.backToTopBtn = document.getElementById('back-to-top');
    
    // Jokes Section
    this.jokesContainer = document.getElementById('jokes-container');
    this.jokesList = document.getElementById('jokes-list');
    this.refreshJokesBtn = document.getElementById('refresh-jokes');

    // Launch the application
    this.init();
  }

  // Initializes all UI components
  /**
   * Main initialization method.
   * Calls all page-specific configuration functions.
   */
  init() {
    this.initHamburger();
    this.initTabs();
    this.initBackToTop();
    this.checkSession();
    this.initJokes();
  }

  // Initializes the hamburger menu for mobile
  /**
   * Configures the behavior of the mobile hamburger menu.
   */
  initHamburger() {
    if (!this.hamburger || !this.navMenu) return;

    // Open/Close the menu
    this.hamburger.addEventListener('click', () => {
      this.hamburger.classList.toggle('active');
      this.navMenu.classList.toggle('active');
    });

    // Close the menu when a navigation link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        this.hamburger.classList.remove('active');
        this.navMenu.classList.remove('active');
      });
    });
  }

  // Initializes the tab system
  /**
   * Configures click listeners for the tab navigation system.
   */
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
  /**
   * Toggles the display of the visible tab pane.
   * @param {string} tabId - The ID of the tab to display.
   */
  switchTab(tabId) {
    // Reset all tabs
    this.tabItems.forEach(item => item.classList.remove('active'));
    this.tabPanes.forEach(pane => pane.classList.remove('active'));

    // Activate the selected tab
    const activeItem = document.querySelector(`.tab-item[data-tab="${tabId}"]`);
    const activePane = document.querySelector(`.tab-pane[data-tab="${tabId}"]`);

    if (activeItem) activeItem.classList.add('active');
    if (activePane) activePane.classList.add('active');
  }

  // Initializes the "back to top" button
  /**
   * Configures the visibility and click action of the "Back to top" button.
   */
  initBackToTop() {
    if (!this.backToTopBtn) return;

    // Show/Hide the button based on scroll position
    window.addEventListener('scroll', () => {
      const isScrolled = window.scrollY > 200;
      this.backToTopBtn.style.display = isScrolled ? 'block' : 'none';
    });

    // Scroll the page to the top on click
    this.backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Checks if a user is logged in and updates the UI
  /**
   * Initializes the jokes container and binds the refresh button.
   */
  initJokes() {
    if (!this.jokesContainer) return;

    this.refreshJokesBtn.addEventListener('click', () => this.fetchAndShowJokes());
    
    // Initial fetch of jokes on load
    this.fetchAndShowJokes();
  }

  // ==========================================
  // DATA FETCHING & STATE MANAGEMENT
  // ==========================================

  /**
   * Fetches random jokes from the Chuck Norris API and displays them.
   */
  async fetchAndShowJokes() {
    this.jokesList.innerHTML = '<p>Loading jokes...</p>';
    
    try {
      // Fetch 3 jokes concurrently for better performance
      const jokePromises = [];
      for (let i = 0; i < 3; i++) {
        const request = fetch('https://api.chucknorris.io/jokes/random').then(res => res.json());
        jokePromises.push(request);
      }
      
      const jokes = await Promise.all(jokePromises);

      // Clear loading text
      this.jokesList.innerHTML = ''; 
      
      // Render each joke
      jokes.forEach(joke => {
        const jokeElement = document.createElement('p');
        jokeElement.className = 'joke-item';
        jokeElement.textContent = joke.value;
        this.jokesList.appendChild(jokeElement);
      });
      
    } catch (err) {
      console.error('Failed to fetch jokes:', err);
      this.jokesList.innerHTML = '<p>Could not fetch jokes. Please try again later.</p>';
    }
  }

  /**
   * Checks if the user is currently authenticated via the /profile endpoint.
   */
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
  /**
   * Displays the welcome message for the logged-in user and the logout button.
   * @param {HTMLElement} container - The DOM element to render into.
   * @param {string} username - The logged-in user's name.
   */
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
        window.location.href = '/index.html'; // Redirect to home after logout
      } catch (err) {
        console.error('Logout error:', err);
      }
    });

    container.appendChild(welcomeText);
    container.appendChild(logoutBtn);
  }
}

// Instantiate the SiteUI class once the DOM is fully loaded.
// ==========================================
// INSTANTIATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  new SiteUI();
});
