// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);
let currentChart = null;

// Получение роли пользователя
async function getUserRole(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data().role : null;
}

// Проверка состояния авторизации и настройка интерфейса
async function checkAuthState() {
    const userStatus = document.getElementById("user-status");
    const loginLink = document.getElementById("login-link");
    const logoutBtn = document.getElementById("logout-btn");
    const workoutsBtn = document.getElementById("workouts-button");
    const usersBtn = document.getElementById("users-button");
    const exercisesBtn = document.getElementById("exercises-button");

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userStatus.textContent = `Welcome, ${user.email}`;
            loginLink.style.display = "none";
            logoutBtn.style.display = "block";

            const role = await getUserRole(user.uid);

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
            userStatus.textContent = "Please log in";
            loginLink.style.display = "inline-block";
            logoutBtn.style.display = "none";
            workoutsBtn.style.display = "none";
            usersBtn.style.display = "none";
            exercisesBtn.style.display = "none";
        }
    });
}

// Функция выхода
function logoutUser() {
    signOut(auth)
        .then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Ошибка выхода:", error);
        });
}

// Инициализация бургер-меню
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

// Загрузка пользовательских тренировок
async function loadUserWorkouts(userId) {
    const userWorkoutsRef = collection(db, "userWorkouts", userId, "workouts");
    const q = query(userWorkoutsRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    
    let workouts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    for (let workout of workouts) {
        if (workout.exerciseIds && workout.exerciseIds.length > 0) {
            workout.exercises = await loadExercises(workout.exerciseIds);
        }
    }

    displayWorkouts(workouts);
}

// Загрузка упражнений
async function loadExercises(exerciseIds) {
    const exercises = [];
    for (let id of exerciseIds) {
        const exerciseRef = doc(db, "exercises", id);
        const exerciseDoc = await getDoc(exerciseRef);
        if (exerciseDoc.exists()) {
            exercises.push(exerciseDoc.data());
        } else {
            console.error(`Exercise with ID ${id} not found.`);
        }
    }
    return exercises;
}

// Отображение тренировок
function displayWorkouts(workouts) {
    const container = document.getElementById("workouts-list");
    container.innerHTML = "<h2>Сохраненные тренировки</h2>";
    const totalWorkouts = workouts.length;

    workouts.forEach((workout, index) => {
        const workoutNumber = totalWorkouts - index;
        const workoutElement = document.createElement("div");
        workoutElement.innerHTML = `
            <p><strong>Тренировка № ${workoutNumber}:</strong> ${new Date(workout.date.seconds * 1000).toLocaleDateString("ru-RU")}</p>
            <button onclick="showWorkoutDetails(${index})">Подробнее</button>
        `;
        workoutElement.dataset.details = JSON.stringify(workout);
        container.appendChild(workoutElement);
    });
}

// Показ деталей тренировки
function showWorkoutDetails(index) {
    const workoutElement = document.querySelectorAll("#workouts-list div")[index];
    const workoutData = JSON.parse(workoutElement.dataset.details);

    const exercisesList = workoutData.exercises
        ? workoutData.exercises.map((exercise, exerciseIndex) => 
            `<li>
                <strong>${exercise.exercisename || "Unnamed Exercise"}</strong>: 
                <input type="number" value="${exercise.weight || ""}" id="weight-${index}-${exerciseIndex}" placeholder="Weight (kg)" /><span> кг,</span>
                <span>${exercise.reps} повторений, ${exercise.sets} сета</span>
                <button onclick="showExerciseHistory('${exercise.exercisename}')">История</button>
            </li>`
        ).join("")
        : "Нет доступных данных";

    document.getElementById("popup-content").innerHTML = `
        <h3>Детали тренировки</h3>
        <p><strong>Дата:</strong> ${new Date(workoutData.date.seconds * 1000).toLocaleDateString("ru-RU")}</p>
        <p><strong>Упражнения:</strong></p>
        <ul>${exercisesList}</ul>
        <button onclick="updateWorkout('${workoutData.id}', ${index})">Сохранить изменения</button>
    `;

    document.body.classList.add("modal-open");
    document.getElementById("overlay").style.display = "block";
    document.getElementById("popup").style.display = "block";
}

// Показ истории упражнений
async function showExerciseHistory(exerciseName) {
    console.log("Fetching history for exercise:", exerciseName);
    const userWorkoutsRef = collection(db, "userWorkouts", auth.currentUser.uid, "workouts");
    const snapshot = await getDocs(userWorkoutsRef);

    let exerciseHistory = [];
    snapshot.docs.forEach(doc => {
        const workout = doc.data();
        workout.exercises.forEach(exercise => {
            if (exercise.exercisename === exerciseName && exercise.weight) {
                exerciseHistory.push({
                    date: new Date(workout.date.seconds * 1000).toLocaleDateString("ru-RU"),
                    weight: exercise.weight
                });
            }
        });
    });

    const historyContainer = document.getElementById("exercise-history");
    if (exerciseHistory.length > 0) {
        historyContainer.innerHTML = exerciseHistory.map(entry => 
            `<p>${entry.date}: ${entry.weight} кг</p>`
        ).join('');
        
        const labels = exerciseHistory.map(entry => entry.date);
        const data = exerciseHistory.map(entry => entry.weight);

        if (currentChart) {
            currentChart.destroy();
        }

        const ctx = document.getElementById("exerciseHistoryChart").getContext("2d");
        currentChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Weight History",
                    data: data,
                    borderColor: "rgba(75, 192, 192, 1)",
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    fill: true,
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
    } else {
        historyContainer.innerHTML = "История отсутствует";
    }

    document.body.classList.add("modal-open");
    document.getElementById("overlay").style.display = "block";
    document.getElementById("history-popup").style.display = "block";
}

// Закрытие попапов
function closeHistoryPopup() {
    document.body.classList.remove("modal-open");
    document.getElementById("overlay").style.display = "none";
    document.getElementById("history-popup").style.display = "none";
}

function closePopup() {
    document.body.classList.remove("modal-open");
    document.getElementById("overlay").style.display = "none";
    document.getElementById("popup").style.display = "none";
}

// Обновление тренировки
async function updateWorkout(workoutId, workoutIndex) {
    const workoutElement = document.querySelectorAll("#workouts-list div")[workoutIndex];
    const workoutData = JSON.parse(workoutElement.dataset.details);
    
    workoutData.exercises.forEach((exercise, exerciseIndex) => {
        const weightInput = document.getElementById(`weight-${workoutIndex}-${exerciseIndex}`);
        exercise.weight = parseFloat(weightInput.value) || null;
    });

    const workoutRef = doc(db, "userWorkouts", auth.currentUser.uid, "workouts", workoutId);
    await updateDoc(workoutRef, { exercises: workoutData.exercises });

    closePopup();
    loadUserWorkouts(auth.currentUser.uid);
}

// Загрузка модуля
function loadModule(moduleName, userId) {
    const modules = document.querySelectorAll(".main-content > div");
    modules.forEach(module => module.style.display = "none");
    document.getElementById(`${moduleName}-content`).style.display = "block";

    if (moduleName === "workouts" && userId) {
        loadUserWorkouts(userId);
    }
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
    fetch("menu.html")
        .then(response => response.text())
        .then(html => {
            document.getElementById("navbar-container").innerHTML = html;
            checkAuthState();
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
            checkAuthState();
            initBurgerMenu();
        });

    document.getElementById("workouts-button").addEventListener("click", () => {
        loadModule("workouts", auth.currentUser?.uid);
    });

    document.getElementById("users-button").addEventListener("click", async () => {
        const role = await getUserRole(auth.currentUser?.uid);
        if (role === "admin") {
            loadModule("users", auth.currentUser?.uid);
        } else {
            console.log("Доступ запрещён: только для админов");
        }
    });

    document.getElementById("exercises-button").addEventListener("click", async () => {
        const role = await getUserRole(auth.currentUser?.uid);
        if (role === "admin") {
            loadModule("exercises", auth.currentUser?.uid);
        } else {
            console.log("Доступ запрещён: только для админов");
        }
    });
});

// Экспорт функций в глобальную область для использования в HTML
window.logoutUser = logoutUser;
window.showWorkoutDetails = showWorkoutDetails;
window.showExerciseHistory = showExerciseHistory;
window.closeHistoryPopup = closeHistoryPopup;
window.closePopup = closePopup;
window.updateWorkout = updateWorkout;