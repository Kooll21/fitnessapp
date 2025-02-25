// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCIXtcjkj6kLTqwStdD7RtMCuiycrKBH0k",
    authDomain: "fitnessapp-f519f.firebaseapp.com",
    projectId: "fitnessapp-f519f",
    storageBucket: "fitnessapp-f519f.appspot.com",
    messagingSenderId: "1000735476286",
    appId: "1:1000735476286:web:4a62a875917834dd215f6f",
    measurementId: "G-MJ8K8ZNQM4"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Получение роли пользователя
export async function getUserRole(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        return userDoc.exists() ? userDoc.data().role : null;
    } catch (error) {
        console.error("Ошибка получения роли:", error);
        return null;
    }
}

// Проверка состояния авторизации
export function checkAuthState(callback) {
    const userStatus = document.getElementById("user-status");
    const loginLink = document.getElementById("login-link");
    const logoutBtn = document.getElementById("logout-btn");
    const navbar = document.querySelector(".navbar");

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Авторизован:", user.email);
            if (userStatus) userStatus.textContent = `Welcome, ${user.email}`;
            if (loginLink) loginLink.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "block";
            if (navbar) navbar.style.display = "block";

            const role = await getUserRole(user.uid);
            console.log("Роль:", role);

            // Вызываем callback для специфичной логики страницы
            if (callback) callback(user, role);
        } else {
            console.log("Не авторизован");
            if (userStatus) userStatus.textContent = "Please log in";
            if (loginLink) loginLink.style.display = "inline-block";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (navbar) navbar.style.display = "block";

            if (callback) callback(null, null);
        }
    });
}

// Функция выхода
export function logoutUser() {
    signOut(auth)
        .then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Ошибка выхода:", error);
        });
}

// Инициализация бургер-меню
export function initBurgerMenu() {
    const menuToggle = document.querySelector(".menu-toggle");
    const navbarList = document.querySelector(".navbar-list");

    if (menuToggle && navbarList) {
        menuToggle.addEventListener("click", () => {
            navbarList.classList.toggle("active");
            menuToggle.classList.toggle("active");
        });
    }
}

// Загрузка navbar
export function loadNavbar() {
    fetch("menu.html")
        .then(response => response.text())
        .then(html => {
            document.getElementById("navbar-container").innerHTML = html;
            initBurgerMenu();
        })
        .catch(err => {
            console.error("Ошибка загрузки меню:", err);
            document.getElementById("navbar-container").innerHTML = `
                <button class="menu-toggle"><span class="bar"></span><span class="bar"></span><span class="bar"></span></button>
                <ul class="navbar-list">
                    <li class="navbar-item"><a href="#" class="navbar-link">Home</a></li>
                    <li class="navbar-item"><a href="#" class="navbar-link">Profile</a></li>
                </ul>`;
            initBurgerMenu();
        });
}

// Экспорт функций в window для прямого вызова из HTML
window.logoutUser = logoutUser;
