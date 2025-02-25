import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

async function getUserRole(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data().role : null;
}

async function checkAuthState() {
    const userStatus = document.getElementById("user-status");
    const loginLink = document.getElementById("login-link");
    const logoutBtn = document.getElementById("logout-btn");
    const workoutsBtn = document.getElementById("workouts-button");
    const usersBtn = document.getElementById("users-button");
    const exercisesBtn = document.getElementById("exercises-button");
    const mainContent = document.querySelector(".main-content");

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Пользователь авторизован:", user.email); // Для отладки
            userStatus.textContent = `Welcome, ${user.email}`;
            loginLink.style.display = "none";
            logoutBtn.style.display = "block";
            mainContent.style.display = "block"; // Убеждаемся, что контент виден

            const role = await getUserRole(user.uid);
            console.log("Роль пользователя:", role); // Для отладки

            if (role === "admin") {
                workoutsBtn.style.display = "block";
                usersBtn.style.display = "block";
                exercisesBtn.style.display = "block";
            } else if (role === "user") {
                workoutsBtn.style.display = "block";
                usersBtn.style.display = "none";
                exercisesBtn.style.display = "none";
                loadModule("workouts", user.uid);
            } else {
                workoutsBtn.style.display = "block";
                usersBtn.style.display = "none";
                exercisesBtn.style.display = "none";
            }
        } else {
            console.log("Пользователь не авторизован"); // Для отладки
            userStatus.textContent = "Please log in";
            loginLink.style.display = "inline-block";
            logoutBtn.style.display = "none";
            workoutsBtn.style.display = "none";
            usersBtn.style.display = "none";
            exercisesBtn.style.display = "none";
            mainContent.style.display = "block"; // Показываем контент даже без авторизации
        }
    });
}

function logoutUser() {
    signOut(auth)
        .then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Ошибка выхода:", error);
        });
}

function loadModule(moduleName, userId) {
    const modules = document.querySelectorAll(".main-content > div");
    modules.forEach(module => module.style.display = "none");
    document.getElementById(`${moduleName}-content`).style.display = "block";
}

document.addEventListener("DOMContentLoaded", function () {
    checkAuthState();

    document.getElementById("workouts-button").addEventListener("click", () => {
        loadModule("workouts", auth.currentUser?.uid);
    });

    document.getElementById("users-button").addEventListener("click", async () => {
        const role = await getUserRole(auth.currentUser?.uid);
        if (role === "admin") loadModule("users", auth.currentUser?.uid);
    });

    document.getElementById("exercises-button").addEventListener("click", async () => {
        const role = await getUserRole(auth.currentUser?.uid);
        if (role === "admin") loadModule("exercises", auth.currentUser?.uid);
    });
});

window.logoutUser = logoutUser;
window.closePopup = () => {
    document.body.classList.remove("modal-open");
    document.getElementById("overlay").style.display = "none";
    document.getElementById("popup").style.display = "none";
};
window.closeHistoryPopup = () => {
    document.body.classList.remove("modal-open");
    document.getElementById("overlay").style.display = "none";
    document.getElementById("history-popup").style.display = "none";
};