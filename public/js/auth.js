const switchAuthTab = (tabId) => {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const data = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    if (data.user.role === 'ADMIN') {
                        window.location.href = '/admin-dashboard.html';
                    } else if (data.user.role === 'TEACHER') {
                        window.location.href = '/teacher-dashboard.html';
                    } else {
                        window.location.href = '/student-dashboard.html';
                    }
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const payload = {
                id: document.getElementById('regId').value || undefined,
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value
            };

            try {
                await apiFetch('/auth/register/student', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast('Registration successful! Please login.', 'success');
                switchAuthTab('loginTab');
                registerForm.reset();
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    // Check if already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
        const parsed = JSON.parse(user);
        if (parsed.role === 'ADMIN') {
            window.location.href = '/admin-dashboard.html';
        } else if (parsed.role === 'TEACHER') {
            window.location.href = '/teacher-dashboard.html';
        } else {
            window.location.href = '/student-dashboard.html';
        }
    }
});
