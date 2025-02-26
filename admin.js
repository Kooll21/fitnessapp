// admin.js
import { auth, db, checkAuthState, getUserRole, loadNavbar } from './auth.js';

// Переменная для графика
let currentChart = null;

// Глобальный массив для хранения данных тренировок
let workoutsData = [];

async function loadUserWorkouts(userId) {
    try {
        console.log("Загрузка тренировок для пользователя:", userId);
        const userWorkoutsRef = db.collection("userWorkouts").doc(userId).collection("workouts");
        const snapshot = await userWorkoutsRef.orderBy("date", "desc").get();

        console.log("Снимок данных из Firestore:", snapshot.docs.length, "тренировок");
        workoutsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

        workoutsData.forEach(workout => {
            if (!workout.exercises || !Array.isArray(workout.exercises)) {
                console.warn(`Тренировка ${workout.id} не содержит корректный массив exercises`);
                workout.exercises = [];
            }
            console.log(`Тренировка ${workout.id}:`, workout);
        });

        displayWorkouts(workoutsData);
    } catch (error) {
        console.error("Ошибка загрузки тренировок:", error);
        document.getElementById("workouts-list").innerHTML = "<p>Ошибка загрузки тренировок</p>";
    }
}

async function loadUsers() {
    try {
        console.log("Загрузка списка пользователей");
        const usersRef = db.collection("users");
        const snapshot = await usersRef.get();

        console.log("Снимок пользователей из Firestore:", snapshot.docs.length, "пользователей");
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        displayUsers(users);
    } catch (error) {
        console.error("Ошибка загрузки пользователей:", error);
        document.getElementById("users-content").innerHTML = "<p>Ошибка загрузки пользователей</p>";
    }
}

function displayUsers(users) {
    const container = document.getElementById("users-content");
    container.innerHTML = "<h2>Управление пользователями</h2>";

    if (users.length === 0) {
        container.innerHTML += "<p>Пользователи отсутствуют</p>";
        return;
    }

    const userList = document.createElement("div");
    userList.className = "user-list";

    users.forEach(user => {
        const userCard = document.createElement("div");
        userCard.className = "user-card";
        userCard.innerHTML = `
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Роль:</strong> ${user.role || "Не указана"}</p>
            <button class="view-workouts-btn">Просмотреть тренировки</button>
        `;

        const viewButton = userCard.querySelector(".view-workouts-btn");
        viewButton.addEventListener("click", () => {
            loadUserWorkouts(user.id);
            loadModule("workouts", user.id);
        });

        userList.appendChild(userCard);
    });

    container.appendChild(userList);
}

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
        const workoutCard = document.createElement("div");
        workoutCard.className = "workout-card";
        workoutCard.innerHTML = `
            <p><strong>Тренировка №${workoutNumber}</strong>: ${new Date(workout.date.seconds * 1000).toLocaleDateString("ru-RU")}</p>
            <div class="exercise-count">Упражнений: ${workout.exercises.length}</div>
            <button onclick="showWorkoutDetails(${index})">Подробнее</button>
        `;
        container.appendChild(workoutCard);
    });
}

function showWorkoutDetails(index) {
    const workoutData = workoutsData[index];
    if (!workoutData) {
        console.error(`Тренировка с индексом ${index} не найдена в workoutsData`);
        alert("Ошибка: данные тренировки недоступны");
        return;
    }

    console.log(`Детали тренировки ${index}:`, workoutData);

    const exercisesList = workoutData.exercises.length > 0
        ? workoutData.exercises.map((exercise, exerciseIndex) => 
            `<li>
                <strong>${exercise.exercisename || "Unnamed Exercise"}</strong>: 
                <input type="number" value="${exercise.weight || ""}" id="weight-${index}-${exerciseIndex}" placeholder="Weight (kg)" /><span> кг,</span>
                <span>${exercise.reps || 0} повторений, ${exercise.sets || 0} сета</span>
                <button onclick="showExerciseHistory('${exercise.exercisename || ''}')">История</button>
            </li>`
          ).join("")
        : "<p>Упражнения отсутствуют</p>";

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

async function showExerciseHistory(exerciseName) {
    console.log("Fetching history for exercise:", exerciseName);
    try {
        const userWorkoutsRef = db.collection("userWorkouts").doc(auth.currentUser.uid).collection("workouts");
        const snapshot = await userWorkoutsRef.get();

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
            ).join("");
            
            const labels = exerciseHistory.map(entry => entry.date);
            const data = exerciseHistory.map(entry => entry.weight);

            if (currentChart) currentChart.destroy();

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

async function updateWorkout(workoutId, workoutIndex) {
    try {
        const workoutData = workoutsData[workoutIndex];
        if (!workoutData) {
            console.error(`Тренировка с индексом ${workoutIndex} не найдена`);
            return;
        }
        
        workoutData.exercises.forEach((exercise, exerciseIndex) => {
            const weightInput = document.getElementById(`weight-${workoutIndex}-${exerciseIndex}`);
            exercise.weight = parseFloat(weightInput.value) || null;
        });

        const workoutRef = db.collection("userWorkouts").doc(auth.currentUser.uid).collection("workouts").doc(workoutId);
        await workoutRef.update({ exercises: workoutData.exercises });

        closePopup();
        loadUserWorkouts(auth.currentUser.uid);
    } catch (error) {
        console.error("Ошибка обновления тренировки:", error);
    }
}

function loadModule(moduleName, userId) {
    const modules = document.querySelectorAll(".main-content > div");
    modules.forEach(module => module.style.display = "none");
    document.getElementById(`${moduleName}-content`).style.display = "block";

    if (moduleName === "workouts" && userId) {
        loadUserWorkouts(userId);
    } else if (moduleName === "users" && userId) {
        loadUsers();
    }
}

// Функция отображения формы для добавления упражнения
function showAddExerciseForm() {
    document.getElementById("popup-content").innerHTML = `
        <h3>Добавить новое упражнение</h3>
        <form id="exerciseForm">
            <label for="category">Категория (группа мышц):</label>
            <select id="category">
                <option value="Chest">Грудь</option>
                <option value="Biceps">Бицепс</option>
                <option value="Back">Спина</option>
                <option value="Legs">Ноги</option>
                <option value="Shoulders">Плечи</option>
                <option value="Triceps">Трицепс</option>
            </select><br><br>

            <label for="exerciseName">Название упражнения:</label>
            <input type="text" id="exerciseName" required><br><br>

            <label for="exerciseType">Тип упражнения:</label>
            <input type="text" id="exerciseType"><br><br>

            <label for="sets">Количество подходов:</label>
            <input type="text" id="sets"><br><br>

            <label for="reps">Количество повторений:</label>
            <input type="text" id="reps"><br><br>

            <label for="muscle">Основная мышца:</label>
            <input type="text" id="muscle"><br><br>

            <label for="muscleTypeAdditional">Доп. мышцы:</label>
            <input type="text" id="muscleTypeAdditional"><br><br>

            <label for="videoUrl">Ссылка на видео (YouTube):</label>
            <input type="url" id="videoUrl"><br><br>

            <label for="photoUrl">Ссылка на фото:</label>
            <input type="url" id="photoUrl"><br><br>

            <label for="description">Описание упражнения:</label><br>
            <textarea id="description" rows="4" cols="40"></textarea><br><br>

            <button type="button" onclick="addExercise()">Добавить упражнение</button>
        </form>
    `;

    document.body.classList.add("modal-open");
    document.getElementById("overlay").style.display = "block";
    document.getElementById("popup").style.display = "block";
}

// Функция добавления упражнения в Firestore
function addExercise() {
    const category = document.getElementById("category").value.trim();
    const exerciseName = document.getElementById("exerciseName").value.trim();

    if (!category || !exerciseName) {
        alert("Выберите категорию и введите название упражнения!");
        return;
    }

    const exerciseData = {
        exerciseid: exerciseName,
        exercisename: exerciseName,
        exercisetype: document.getElementById("exerciseType").value.trim(),
        sets: document.getElementById("sets").value.trim(),
        reps: document.getElementById("reps").value.trim(),
        muscle: document.getElementById("muscle").value.trim(),
        muscletypeadditional: document.getElementById("muscleTypeAdditional").value.trim(),
        video: document.getElementById("videoUrl").value.trim(),
        photo: document.getElementById("photoUrl").value.trim(),
        description: document.getElementById("description").value.trim()
    };

    db.collection("workouts").doc(category).collection("exercises").doc(exerciseName).set(exerciseData)
        .then(() => {
            alert("Упражнение добавлено в " + category);
            closePopup();
        })
        .catch((error) => {
            console.error("Ошибка при добавлении упражнения: ", error);
            alert("Ошибка при добавлении упражнения!");
        });
}

// Функция массового импорта упражнений
function showBulkImportForm() {
    document.getElementById("popup-content").innerHTML = `
        <h3>Массовый импорт упражнений</h3>
        <label for="bulkCollectionSelect">Выберите категорию:</label>
        <select id="bulkCollectionSelect">
            <option value="Chest">Грудь</option>
            <option value="Biceps">Бицепс</option>
            <option value="Back">Спина</option>
            <option value="Legs">Ноги</option>
            <option value="Shoulders">Плечи</option>
            <option value="Triceps">Трицепс</option>
        </select><br><br>
        <label for="bulkDataInput">Вставьте данные из Excel (разделённые табуляцией):</label><br>
        <textarea id="bulkDataInput" rows="10" cols="50" placeholder="Скопируйте данные из Excel и вставьте сюда"></textarea><br><br>
        <button type="button" onclick="previewBulkData()">Предпросмотр</button>
        <div id="bulkPreviewTable" style="margin-top: 20px;"></div>
    `;

    document.body.classList.add("modal-open");
    document.getElementById("overlay").style.display = "block";
    document.getElementById("popup").style.display = "block";
}

function previewBulkData() {
    const inputData = document.getElementById("bulkDataInput").value.trim();
    const collection = document.getElementById("bulkCollectionSelect").value;
    if (!inputData) {
        alert("Пожалуйста, вставьте данные!");
        return;
    }

    const rows = inputData.split("\n").map(row => row.split("\t").map(cell => cell.trim()));
    const headers = rows[0];
    const data = rows.slice(1).filter(row => row.some(cell => cell)); // Убираем пустые строки

    let tableHTML = '<table style="width: 100%; border-collapse: collapse;">';
    tableHTML += '<tr>' + headers.map(header => `<th style="border: 1px solid #ccc; padding: 8px;">${header}</th>`).join("") + '</tr>';
    data.forEach(row => {
        tableHTML += '<tr>' + row.map(cell => `<td style="border: 1px solid #ccc; padding: 8px;">${cell}</td>`).join("") + '</tr>';
    });
    tableHTML += '</table>';
    tableHTML += '<button style="margin-top: 10px;" onclick="uploadBulkData()">Сохранить в базу</button>';

    document.getElementById("bulkPreviewTable").innerHTML = tableHTML;
    window.bulkData = { collection, headers, data }; // Сохраняем данные для последующего импорта
}

function uploadBulkData() {
    const { collection, headers, data } = window.bulkData;
    if (!collection || !data.length) {
        alert("Нет данных для импорта!");
        return;
    }

    const sanitizeDocumentName = (name) => name.replace(/[\/\[\]]/g, "_");

    data.forEach(async (row) => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || "";
        });
        const documentName = sanitizeDocumentName(obj.exercisename || `exercise_${Date.now()}`);
        try {
            await db.collection("workouts").doc(collection).collection("exercises").doc(documentName).set(obj);
            console.log("Документ добавлен:", obj);
        } catch (error) {
            console.error("Ошибка добавления:", error);
        }
    });

    alert("Данные успешно загружены в " + collection);
    closePopup();
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("Страница загружена (admin)");
    loadNavbar();
    checkAuthState((user, role) => {
        const workoutsBtn = document.getElementById("workouts-button");
        const usersBtn = document.getElementById("users-button");
        const exercisesBtn = document.getElementById("exercises-button");
        const addExerciseBtn = document.getElementById("add-exercise-button");
        const bulkImportBtn = document.getElementById("bulk-import-button");
        const logoutBtn = document.getElementById("logout-btn");
        const userStatus = document.getElementById("user-status");

        if (user) {
            userStatus.textContent = `Welcome, ${user.email}`;
            workoutsBtn.style.display = "block";
            logoutBtn.style.display = "block";
            if (role === "admin") {
                usersBtn.style.display = "block";
                exercisesBtn.style.display = "block";
                addExerciseBtn.style.display = "block";
                bulkImportBtn.style.display = "block";
                addExerciseBtn.addEventListener("click", () => showAddExerciseForm());
                bulkImportBtn.addEventListener("click", () => showBulkImportForm());
            } else {
                usersBtn.style.display = "none";
                exercisesBtn.style.display = "none";
                addExerciseBtn.style.display = "none";
                bulkImportBtn.style.display = "none";
            }
        } else {
            userStatus.textContent = "Войдите в свой профиль";
            workoutsBtn.style.display = "none";
            usersBtn.style.display = "none";
            exercisesBtn.style.display = "none";
            addExerciseBtn.style.display = "none";
            bulkImportBtn.style.display = "none";
            logoutBtn.style.display = "none";
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

    document.getElementById("logout-btn").addEventListener("click", () => {
        auth.signOut().then(() => {
            console.log("Пользователь вышел");
        }).catch((error) => {
            console.error("Ошибка выхода:", error);
        });
    });
});

window.showWorkoutDetails = showWorkoutDetails;
window.showExerciseHistory = showExerciseHistory;
window.closeHistoryPopup = closeHistoryPopup;
window.closePopup = closePopup;
window.updateWorkout = updateWorkout;
window.addExercise = addExercise;
window.previewBulkData = previewBulkData;
window.uploadBulkData = uploadBulkData;