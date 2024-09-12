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

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage);
