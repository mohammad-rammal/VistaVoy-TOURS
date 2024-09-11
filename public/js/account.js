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

document.querySelector('.form-user-data').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    console.log(form);

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;

    updateData(form, 'data');
});

document.querySelector('.form-user-password').addEventListener('submit', async (e) => {
    e.preventDefault();
    const passwordSaveBtn = document.querySelector('.btn--save--password');
    passwordSaveBtn.textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    const result = await updateData({passwordCurrent, password, passwordConfirm}, 'password');

    // Reset button text after operation is completed
    passwordSaveBtn.textContent = 'Save password';

    // Clear the password fields after successful update
    if (result && result.status === 'success') {
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    }
});

const updateData = async (data, type) => {
    try {
        const url =
            type === 'password'
                ? '/api/v1/users/updateMyPassword'
                : '/api/v1/users/updateMe';

        const response = await axios.patch(url, data, {withCredentials: true});
        const result = response.data;

        if (result.status === 'success') {
            showAlert('success', `${type.toUpperCase()} Updated successfully`);
        } else {
            showAlert('error', result.message || 'An error occurred');
        }

        return result; // Return the result to be used in the form submission function
    } catch (error) {
        showAlert('error', error.response?.data?.message || 'An error occurred');
    }
};

// document.querySelector('.form-user-data').addEventListener('submit', (e) => {
//     e.preventDefault();
//     const name = document.getElementById('name').value;
//     const email = document.getElementById('email').value;

//     updateData(email, name);
// });

// const updateData = async (email, name) => {
//     try {
//         const response = await axios.patch(
//             'http://localhost:5000/api/v1/users/updateMe',
//             {email, name},
//             {withCredentials: true}
//         );

//         const result = response.data;

//         if (result.status === 'success') {
//             showAlert('success', 'Updated successfully');
//             ;
//         } else {
//             showAlert('error', result.message || 'An error occurred');
//         }
//     } catch (error) {
//         showAlert('error', error.response?.data?.message || 'An error occurred');
//     }
// };
