// admin.js
import { auth, db, checkAuthState, loadNavbar, initBurgerMenu, getUserRole } from './auth.js';
import { collection, getDocs, query, orderBy, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

// Переменная для графика
let currentChart = null;

// Загрузка пользовательских тренировок
async function loadUserWorkouts(userId) {
    try {
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
    } catch (error) {
        console.error("Ошибка загрузки тренировок:", error);
        document.getElementById("workouts-list").innerHTML = "<p>Ошибка загрузки тренировок</p>";
    }
}

// Загрузка упражнений
async function loadExercises(exerciseIds) {
    const exercises = [];
    try {
        for (let id of exerciseIds) {
            const exerciseRef = doc(db, "exercises", id);
            const exerciseDoc = await getDoc(exerciseRef);
            if (exerciseDoc.exists()) {
                exercises.push(exerciseDoc.data());
            } else {
                console.error(`Exercise with ID ${id} not found.`);
            }
        }
    } catch (error) {
        console.error("Ошибка загрузки упражнений:", error);
    }
    return exercises;
}

// Отображение тренировок
function displayWorkouts(workouts) {
    const container = document.getElementById("workouts-list");
    container.innerHTML = "<h2>Сохраненные тренировки</h2>";
    const totalWorkouts = workouts.length;

    if (totalWorkouts === 0) {
        container.innerHTML += "<p>Нет сохранённых тренировок</p>";
        return;
    }

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
    try {
        const userWorkoutsRef = collection(db, "userWorkouts", auth.currentUser.uid, "workouts");
        const snapshot = await getDocs(userWorkoutsRef);

        let exerciseHistory = [];
        snapshot.docs.forEach(doc => {
            const workout = doc.data();
            if (workout.exercises) {
                workout.exercises.forEach(exercise => {
                    if (exercise.exercisename === exerciseName && exercise.weight) {
                        exerciseHistory.push({
                            date: new Date(workout.date.seconds * 1000).toLocaleDateString("ru-RU"),
                            weight: exercise.weight
                        });
                    }
                });
            }
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
    } catch (error) {
        console.error("Ошибка загрузки истории:", error);
        document.getElementById("exercise-history").innerHTML = "<p>Ошибка загрузки истории</p>";
    }
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
    try {
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
    } catch (error) {
        console.error("Ошибка обновления тренировки:", error);
    }
}

// Переключение модулей
function loadModule(moduleName, userId) {
    const modules = document.querySelectorAll(".main-content > div");
    modules.forEach(module => module.style.display = "none");
    document.getElementById(`${moduleName}-content`).style.display = "block";

    if (moduleName === "workouts" && userId) {
        loadUserWorkouts(userId);
    }
}

// Инициализация страницы
document.addEventListener("DOMContentLoaded", () => {
    console.log("Страница загружена (admin)");
    loadNavbar();

    checkAuthState((user, role) => {
        const workoutsBtn = document.getElementById("workouts-button");
        const usersBtn = document.getElementById("users-button");
        const exercisesBtn = document.getElementById("exercises-button");

        if (user && role === "admin") {
            workoutsBtn.style.display = "block";
            usersBtn.style.display = "block";
            exercisesBtn.style.display = "block";
        } else if (user && role === "user") {
            workoutsBtn.style.display = "block";
            usersBtn.style.display = "none";
            exercisesBtn.style.display = "none";
            loadModule("workouts", user.uid);
        } else {
            workoutsBtn.style.display = "none";
            usersBtn.style.display = "none";
            exercisesBtn.style.display = "none";
        }
    });

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

// Экспорт функций для HTML
window.showWorkoutDetails = showWorkoutDetails;
window.showExerciseHistory = showExerciseHistory;
window.closeHistoryPopup = closeHistoryPopup;
window.closePopup = closePopup;
window.updateWorkout = updateWorkout;