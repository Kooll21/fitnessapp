function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    document.getElementById(sectionId).style.display = 'block';
}
🔹 Firebase Authentication Code (JS)
Now, add this inside <script> in index.html:

js
Zkopírovat
Upravit
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            document.getElementById("authStatus").innerText = "Регистрация успешна!";
        })
        .catch(error => alert(error.message));
}

function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            document.getElementById("authStatus").innerText = "Вы вошли!";
        })
        .catch(error => alert(error.message));
}

function logout() {
    signOut(auth).then(() => {
        document.getElementById("authStatus").innerText = "Вы вышли.";
    }).catch(error => alert(error.message));
}

// Track user state
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById("authStatus").innerText = `Вы вошли как ${user.email}`;
    } else {
        document.getElementById("authStatus").innerText = "Вы не авторизованы.";
    }
});
✅ Now users can register, log in, and log out.
