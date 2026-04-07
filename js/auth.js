document.addEventListener('DOMContentLoaded', () => {
    const handleForm = (formId, endpoint, successMsg) => {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msgBox = document.getElementById(`${formId.split('-')[0]}-message`);
            const token = await fetch('/csrf-token').then(r => r.json()).then(d => d.csrfToken);

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
                body: JSON.stringify({ username: form.username.value, password: form.password.value }),
            });
            const data = await res.json();

            if (res.ok) {
                if (data.redirect) window.location.href = data.redirect;
                else {
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

    handleForm('register-form', '/register', 'Registration successful! You can now log in.');
    handleForm('login-form', '/login', 'Success');
});
