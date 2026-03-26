/**
 * @file Manages the client-side authentication process (login and registration).
 * @description This script handles form submissions for user login and registration,
 * including fetching a CSRF token for security, sending credentials to the server,
 * and displaying feedback messages to the user.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get references to the form elements and message display areas.
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const registerMessage = document.getElementById('register-message');
    const loginMessage = document.getElementById('login-message');

    /**
     * Fetches a CSRF token from the server.
     * This token is required for all state-changing requests (POST, DELETE, etc.)
     * to prevent Cross-Site Request Forgery attacks.
     * @returns {Promise<string|null>} A promise that resolves to the CSRF token, or null if an error occurs.
     */
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

    // --- Registration Form Handling ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent the default browser form submission.
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            registerMessage.textContent = ''; // Clear any previous messages.

            // Fetch a fresh CSRF token before submitting.
            const csrfToken = await getCsrfToken();
            if (!csrfToken) {
                registerMessage.textContent = 'Could not secure session. Please try again.';
                registerMessage.style.color = 'red';
                return;
            }

            try {
                // Send the registration request to the server.
                const res = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken // Include CSRF token in the request header.
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await res.json();

                // Handle the server's response.
                if (res.ok) {
                    registerMessage.textContent = 'Registration successful! You can now log in.';
                    registerMessage.style.color = 'green';
                    registerForm.reset(); // Clear the form fields on success.
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

    // --- Login Form Handling ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent the default browser form submission.
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            loginMessage.textContent = ''; // Clear any previous messages.
            
            // Fetch a fresh CSRF token before submitting.
            const csrfToken = await getCsrfToken();
            if (!csrfToken) {
                loginMessage.textContent = 'Could not secure session. Please try again.';
                loginMessage.style.color = 'red';
                return;
            }

            try {
                // Send the login request to the server.
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': csrfToken // Include CSRF token in the request header.
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await res.json();

                // Handle the server's response.
                if (res.ok && data.redirect) {
                    // On successful login, redirect the user to the specified page.
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
