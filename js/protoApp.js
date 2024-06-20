const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    hashPassword(password).then(hashedPassword => {
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: hashedPassword,
            }),
        })
        .then(response => {
            if(response.ok) {
                return response.json();
            } else {
                throw new Error('Login failed!');
            }
        })
        .then(data => {
            console.log('Login Response:', data);
            if(data.token) {
                localStorage.setItem('jwtToken', data.token);
                alert('Login successful! Redirecting...');
                //redirect to /home
                window.location.href = '/home';
            } else {
                throw new Error('No token acquired!');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    });
});

registerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('newUsername').value;
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    const passwordConfirm = document.getElementById('newPasswordConfirm').value;

    if (password !== passwordConfirm) {
        alert('Passwords do not match!');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters long!');
        return;
    }

    if (password.toLowerCase().includes(username.toLowerCase())) {
        alert('Password cannot contain your username!');
        return;
    }

    if (password.toLowerCase().includes(email.toLowerCase())) {
        alert('Password cannot contain your email!');
        return;
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        alert('Password must contain at least one lowercase letter, one uppercase letter, and one number!');
        return;
    }

    if (username.length < 3) {
        alert('Username must be longer than 3 characters!');
        return;
    }

    hashPassword(password).then(hashedPassword => {
        fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: hashedPassword,
            }),
        })
        .then(response => {
            if(response.ok) {
                return response.json();
            } else {
                throw new Error('Registration failed!');
            }
        })
        .then(data => {
            console.log(data);
            alert('Registration successful! You can now log in.');
            //redirect to login page
            container.classList.remove("active");
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error registering: ' + error.message);
        });
    });
});

function hashPassword(password) {
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
        .then(hash => {
            return Array.from(new Uint8Array(hash))
                .map(byte => byte.toString(16).padStart(2, '0'))
                .join('');
        });
}
