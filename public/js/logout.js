const showAlert = (type, msg) => {
    hideAlert();

    const icons = {
        success: '✔️',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    const markup = `
        <div class="alert alert--${type} animate-slide-in">
            <span class="alert__icon">${icons[type] || icons.info}</span>
            <span class="alert__msg">${msg}</span>
            <span class="alert__close-btn">&times;</span>
        </div>`;

    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

    document.querySelector('.alert__close-btn').addEventListener('click', hideAlert);

    window.setTimeout(hideAlert, 5000);
};

const hideAlert = () => {
    const alert = document.querySelector('.alert');
    if (alert) {
        alert.classList.add('animate-bounce-out');
        setTimeout(() => alert.remove(), 700); // Adjusted for bounce-out animation duration
    }
};

// Ensure that the DOM is fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
    const logOutBtn = document.querySelector('.nav__el--logout');

    if (logOutBtn) {
        logOutBtn.addEventListener('click', logout);
    }

    async function logout() {
        try {
            const res = await axios({
                method: 'GET',
                url: '/api/v1/users/logout',
            });

            if (res.data.status === 'success') {
                location.reload(true); // Hard refresh to update cookies
                showAlert('success', 'Logging out..');
            } else {
                showAlert('error', 'Logout failed!');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            showAlert('error', 'Error logging out! Try again.');
        }
    }
});
