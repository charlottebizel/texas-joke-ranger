/**
 * Handles the login and registration forms using AJAX fetch requests.
 * This prevents page reloads and provides smooth user feedback.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Generic function to handle form submission (both login and register)
    const handleForm = (formId, endpoint, successMsg) => {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgBox = document.getElementById(`${formId.split('-')[0]}-message`);
            // Fetch the CSRF token to secure the POST request
            const token = await fetch('/csrf-token').then(r => r.json()).then(d => d.csrfToken);

            // Send credentials to the server API endpoint
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
                body: JSON.stringify({ username: form.username.value, password: form.password.value }),
            });
            const data = await res.json();

            // Handle server response
            if (res.ok) {
                if (data.redirect) {
                    sessionStorage.setItem('tab_session', 'active');
                    window.location.href = data.redirect;
                } else {
                    // Display success message and reset the form
                    msgBox.textContent = successMsg;
                    msgBox.style.color = 'green';
                    form.reset();
                }
            } else {
                msgBox.textContent = data.message;
                msgBox.style.color = 'red';
            }
        });
    };

    // Initialize handlers for both authentication forms
    handleForm('register-form', '/register', 'Registration successful! You can now log in.');
    handleForm('login-form', '/login', 'Success');
});
