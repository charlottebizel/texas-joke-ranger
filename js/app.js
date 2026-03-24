document.addEventListener('DOMContentLoaded', () => {
  const userSession = document.getElementById('user-session');

  // Vérifie le statut de connexion de l'utilisateur
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
      console.error('Erreur de session:', err);
    }
  }

  // Affiche le bouton de déconnexion et le nom d'utilisateur
  function showLogout(username) {
    if (userSession) {
      userSession.innerHTML = ''; // Clear existing content
      
      const welcomeText = document.createElement('span');
      welcomeText.textContent = `Bonjour, ${username}`;

      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logout-btn';
      logoutBtn.textContent = 'Déconnexion';

      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch('/logout');
          window.location.href = '/index.html';
        } catch (err) {
          console.error('Erreur de déconnexion:', err);
        }
      });

      userSession.appendChild(welcomeText);
      userSession.appendChild(logoutBtn);
    }
  }

  // Affiche les liens de connexion et d'inscription
  function showLogin() {
    if (userSession) {
      userSession.innerHTML = '';
    }
  }

  // Lancer la vérification de session
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
