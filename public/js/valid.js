document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-btn');

    const updateButtonState = () => {
        if (emailInput.validity.valid && passwordInput.validity.valid) {
            loginButton.classList.add('btn--green');
        } else {
            loginButton.classList.remove('btn--green');
        }
    };

    emailInput.addEventListener('input', updateButtonState);
    passwordInput.addEventListener('input', updateButtonState);
});
