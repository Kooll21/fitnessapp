// auth.js
if (!firebase.apps.length) {
    var firebaseConfig = {
        apiKey: "AIzaSyCIXtcjkj6kLTqwStdD7RtMCuiycrKBH0k",
        authDomain: "fitnessapp-f519f.firebaseapp.com",
        projectId: "fitnessapp-f519f",
        storageBucket: "fitnessapp-f519f.appspot.com",
        messagingSenderId: "1000735476286",
        appId: "1:1000735476286:web:4a62a875917834dd215f6f",
        measurementId: "G-MJ8K8ZNQM4"
    };
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();

export function getUserRole(uid) {
    return db.collection("users").doc(uid).get()
        .then(doc => doc.exists ? doc.data().role : null)
        .catch(error => {
            console.error("Ошибка получения роли:", error);
            return null;
        });
}

export function checkAuthState(callback) {
    auth.onAuthStateChanged(async (user) => {
        const userStatus = document.getElementById("user-status");
        const loginLink = document.getElementById("login-link");
        const registerLink = document.getElementById("register-link");
        const logoutBtn = document.getElementById("logout-btn");

        if (user) {
            console.log("Авторизован:", user.email);
            if (userStatus) userStatus.textContent = `Welcome, ${user.email}`;
            if (loginLink) loginLink.style.display = "none";
            if (registerLink) registerLink.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "inline-block";

            const role = await getUserRole(user.uid);
            console.log("Роль:", role);

            if (callback) callback(user, role);
        } else {
            console.log("Не авторизован");
            if (userStatus) userStatus.textContent = "Please log in";
            if (loginLink) loginLink.style.display = "inline-block";
            if (registerLink) registerLink.style.display = "inline-block";
            if (logoutBtn) logoutBtn.style.display = "none";

            if (callback) callback(null, null);
        }
    });
}

export function logoutUser() {
    auth.signOut()
        .then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Ошибка выхода:", error);
        });
}

export function loadNavbar() {
    fetch("menu.html")
        .then(response => response.text())
        .then(html => {
            document.getElementById("navbar-container").innerHTML = html;
            initBurgerMenu();
            checkAuthState(); // Обновляем статус после загрузки
        })
        .catch(err => {
            console.error("Ошибка загрузки меню:", err);
            document.getElementById("navbar-container").innerHTML = `
                <button class="menu-toggle"><span class="bar"></span><span class="bar"></span><span class="bar"></span></button>
                <ul class="navbar-list">
                    <li class="navbar-item"><a href="#" class="navbar-link">Home</a></li>
                    <li class="navbar-item"><a href="#" class="navbar-link">Profile</a></li>
                </ul>
                <div class="auth-status">
                    <span id="user-status">Please log in</span>
                    <a href="login.html" id="login-link">Login</a>
                    <a href="register.html" id="register-link">Register</a>
                    <button id="logout-btn" onclick="logoutUser()" style="display: none;">Logout</button>
                </div>`;
            initBurgerMenu();
            checkAuthState(); // Обновляем статус для запасного контента
        });
}

function initBurgerMenu() {
    const menuToggle = document.querySelector(".menu-toggle");
    const navbarList = document.querySelector(".navbar-list");

    if (menuToggle && navbarList) {
        menuToggle.addEventListener("click", () => {
            navbarList.classList.toggle("active");
            menuToggle.classList.toggle("active");
        });
    }
}

window.checkAuthState = checkAuthState;
window.logoutUser = logoutUser;
window.loadNavbar = loadNavbar;
window.initBurgerMenu = initBurgerMenu;