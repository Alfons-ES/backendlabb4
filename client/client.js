const API = 'http://localhost:5000/api';

// Kolla om redan inloggad
if (sessionStorage.getItem('token')) showDashboard();

async function register() {
    const res = await fetch(API + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getInputs())
    });
    const data = await res.json();
    document.getElementById('msg').textContent = data.message;
}

async function login() {
    const res = await fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getInputs())
    });
    const data = await res.json();
    if (res.ok) {
        sessionStorage.setItem('token', data.token);
        showDashboard();
    } else {
        document.getElementById('msg').textContent = data.message;
    }
}

async function showDashboard() {
    const res = await fetch(API + '/protected', {
        headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('token') }
    });
    if (!res.ok) return logout();
    const data = await res.json();

    document.getElementById('auth-view').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('welcome').textContent = data.message;

    const list = document.getElementById('data-list');
    list.innerHTML = '';
    data.data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
    });
}

function logout() {
    sessionStorage.removeItem('token');
    document.getElementById('auth-view').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function getInputs() {
    return {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };
}