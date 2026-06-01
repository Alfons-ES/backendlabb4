const API = 'http://localhost:7777/api';

// Kolla om redan inloggad
window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('token')) showDashboard();
});
/*
async function register() {
    const res = await fetch(API + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getInputs())
    });
    const data = await res.json();
    document.getElementById('msg').textContent = data.message;
}
*/
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

    const list = document.getElementById('datalist');
    loaditems();
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

async function loaditems() {
    const res = await fetch('http://localhost:7777/meny');
    const data = await res.json();
    //hämta från servern
    const container = document.getElementById('datalist');
    container.innerHTML = '';

    data.forEach(exp => { //för varje id alltså item i databasen skapas en 
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
    <h3>${exp.name}</h3>
    <p>${exp.description}</p>
    <button class="delete-btn" onclick="deleteitem('${exp._id}')">Ta bort</button>
    <button class="edit-btn" onclick="openEditForm('${exp._id}', '${exp.name}', '${exp.description}')">Redigera</button>
`;
        container.appendChild(div);
    });
}

async function deleteitem(id) {
    if (confirm("Är du säker på att du vill ta bort?")) {
        await fetch(`http://localhost:7777/meny/${id}`, { method: 'DELETE' });
        loaditems(); // refresh list
    }
} //ta bort ett arbete, alltså itemt




const form = document.getElementById('itemform');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {// när användaren klickar submit kommer vi köra arrowfunctionen
    e.preventDefault();
    message.textContent = '';

    const name = document.getElementById('name').value; // hämtar alla inputfälts värden. 
    const description = document.getElementById('description').value;

    //om det saknas något får man ett meddelande 
    if (!name || !description) {
        message.textContent = "Fyll i alla fält!";
        return;
    }

    //
    // skickar datan till server med post
    try {
        const res = await fetch('http://localhost:7777/meny', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        }); //konverterar till json och skickar iväg

        if (res.ok) { //om det funkade får man en alert. Vi resetar formen och stannar där om man vill fylla i mer
            alert("Item skapad!");
            form.reset();
            loaditems();
        } else { //annars får man felmeddelande 
            const error = await res.json();
            message.textContent = error.message;
        }
    } catch (err) {
        message.textContent = "Kunde inte nå servern";
    }
});



function openEditForm(id, name, description) {
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-description').value = description;
    document.getElementById('edit-form-container').style.display = 'block';
}

function closeEditForm() {
    document.getElementById('edit-form-container').style.display = 'none';
}

async function submitUpdate() {
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value;
    const description = document.getElementById('edit-description').value;


    const res = await fetch(`http://localhost:7777/meny/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
    });

    if (res.ok) {
        closeEditForm();
        loaditems(); // uppdatera listan
    } else {
        const error = await res.json();
        alert(error.message);
    }
}