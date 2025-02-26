// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/8.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/8.9.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/8.9.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCIXtcjkj6kLTqwStdD7RtMCuiycrKBH0k",
    authDomain: "fitnessapp-f519f.firebaseapp.com",
    projectId: "fitnessapp-f519f",
    storageBucket: "fitnessapp-f519f.appspot.com",
    messagingSenderId: "1000735476286",
    appId: "1:1000735476286:web:4a62a875917834dd215f6f",
    measurementId: "G-MJ8K8ZNQM4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function loadNavbar() {
    fetch('menu.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById("navbar-container").innerHTML = html;
            checkAuthState(); // Вызываем после загрузки HTML
            initBurgerMenu(); // Инициализация бургер-меню
        })
        .catch(err => {
            console.error("Ошибка загрузки меню:", err);
            document.getElementById("navbar-container").innerHTML = `
                <span id="user-status">Войдите в свой профиль или зарегистрируйтесь</span>
                <a href="login.html" id="login-link">Вход</a>
                <button onclick="logoutUser()" id="logout-btn" style="display:none;">Выход</button>`;
            checkAuthState();
        });
}

export function checkAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        const userStatus = document.getElementById("user-status");
        const loginLink = document.getElementById("login-link");
        const logoutBtn = document.getElementById("logout-btn");
        const adminPanel = document.getElementById("admin-panel");

        if (user) {
            userStatus.textContent = `Welcome, ${user.email}`;
            loginLink.style.display = 'none';
            logoutBtn.style.display = 'block';
            adminPanel.style.display = 'block'; // Показываем для всех авторизованных
            if (callback) callback(user);
        } else {
            userStatus.textContent = 'Войдите в свой профиль или зарегистрируйтесь';
            loginLink.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            adminPanel.style.display = 'none';
        }
    });
}

function initBurgerMenu() {
    const menuToggle = document.querySelector(".menu-toggle");
    const navbarList = document.querySelector(".navbar-list");
    if (menuToggle && navbarList) {
        menuToggle.addEventListener("click", function () {
            navbarList.classList.toggle("active");
            menuToggle.classList.toggle("active");
        });
    }
}

export async function getUserRole(uid) {
    if (!uid) return null;
    const userDoc = await db.collection("users").doc(uid).get();
    return userDoc.exists ? userDoc.data().role : null;
}

window.logoutUser = function() {
    auth.signOut().then(() => {
        console.log("Пользователь вышел");
    }).catch((error) => {
        console.error("Ошибка выхода:", error);
    });
};