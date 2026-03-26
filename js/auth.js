document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const registerMessage = document.getElementById('register-message');
    const loginMessage = document.getElementById('login-message');

    // Fonction pour récupérer le token CSRF
    async function getCsrfToken() {
        try {
            const response = await fetch('/csrf-token');
            const data = await response.json();
            return data.csrfToken;
        } catch (error) {
            console.error('Error retrieving CSRF token:', error);
            return null;
        }
    }

    // Gestion de l'inscription
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            registerMessage.textContent = '';

            const csrfToken = await getCsrfToken();
            if (!csrfToken) {
                registerMessage.textContent = 'Could not secure session. Please try again.';
                registerMessage.style.color = 'red';
                return;
            }

            try {
                const res = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await res.json();

                if (res.ok) {
                    registerMessage.textContent = 'Registration successful! You can now log in.';
                    registerMessage.style.color = 'green';
                    registerForm.reset();
                } else {
                    registerMessage.textContent = data.message || 'An error occurred.';
                    registerMessage.style.color = 'red';
                }
            } catch (err) {
                registerMessage.textContent = 'Server connection error.';
                registerMessage.style.color = 'red';
            }
        });
    }

    // Gestion de la connexion
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            loginMessage.textContent = '';
            
            const csrfToken = await getCsrfToken();
            if (!csrfToken) {
                loginMessage.textContent = 'Could not secure session. Please try again.';
                loginMessage.style.color = 'red';
                return;
            }


            try {
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await res.json();

                if (res.ok && data.redirect) {
                    // Rediriger vers la page des blagues après une connexion réussie
                    window.location.href = data.redirect;
                } else {
                    loginMessage.textContent = data.message || 'Invalid credentials.';
                    loginMessage.style.color = 'red';
                }
            } catch (err) {
                loginMessage.textContent = 'Server connection error.';
                loginMessage.style.color = 'red';
            }
        });
    }
});
