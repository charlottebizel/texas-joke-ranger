document.addEventListener('DOMContentLoaded', () => {
  const userSession = document.getElementById('user-session');

  // Check user login status
  async function checkSession() {
    try {
      const res = await fetch('/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.isLoggedIn) {
          showLogout(data.user.username);
        } else {
          showLogin();
        }
      } else {
        showLogin();
      }
    } catch (err) {
      showLogin();
      console.error('Session error:', err);
    }
  }

  // Display logout button and username
  function showLogout(username) {
    if (userSession) {
      userSession.innerHTML = ''; // Clear existing content
      
      const welcomeText = document.createElement('span');
      welcomeText.textContent = `Hello, ${username}`;

      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logout-btn';
      logoutBtn.textContent = 'Logout';

      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch('/logout');
          window.location.href = '/index.html';
        } catch (err) {
          console.error('Logout error:', err);
        }
      });

      userSession.appendChild(welcomeText);
      userSession.appendChild(logoutBtn);
    }
  }

  // Display login and registration links
  function showLogin() {
    if (userSession) {
      userSession.innerHTML = '';
    }
  }

  // Start session check
  checkSession();

  const tabItems = document.querySelectorAll('.tab-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');

      tabItems.forEach(item => item.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));

      item.classList.add('active');
      const activePane = document.querySelector(`.tab-pane[data-tab="${tabId}"]`);
      if (activePane) {
        activePane.classList.add('active');
      }
    });
  });
});
