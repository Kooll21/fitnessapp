// Инициализация Firebase
const firebaseConfig = {
      apiKey: "AIzaSyCIXtcjkj6kLTqwStdD7RtMCuiycrKBH0k",
      authDomain: "fitnessapp-f519f.firebaseapp.com",
      projectId: "fitnessapp-f519f",
      storageBucket: "fitnessapp-f519f.appspot.com",
      messagingSenderId: "1000735476286",
      appId: "1:1000735476286:web:4a62a875917834dd215f6f",
      measurementId: "G-MJ8K8ZNQM4"
    };

// Инициализируем Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Проверяем, авторизован ли пользователь
auth.onAuthStateChanged(user => {
    if (user) {
        loadSavedWorkouts(user.uid); // Загружаем тренировки, если пользователь авторизован
    } else {
        console.log("Пользователь не авторизован");
    }
});

// Функция для сохранения тренировки
async function saveWorkout(userId, workoutData) {
    const workoutsRef = db.collection('users').doc(userId).collection('workouts');
    try {
        const workoutRef = await workoutsRef.add(workoutData);
        console.log("Тренировка сохранена:", workoutRef.id);
        alert('Тренировка сохранена!');
    } catch (error) {
        console.error("Ошибка сохранения тренировки:", error);
        alert('Ошибка сохранения тренировки');
    }
}

// Функция для загрузки сохраненных тренировок
async function loadSavedWorkouts(userId) {
    const workoutsRef = db.collection('users').doc(userId).collection('workouts');
    const snapshot = await workoutsRef.get();

    const savedWorkoutsList = document.getElementById('savedWorkoutsList');
    savedWorkoutsList.innerHTML = ''; // Очистить список перед загрузкой

    snapshot.forEach(doc => {
        const workout = doc.data();
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <h3>${workout.name}</h3>
            <p>Тип тренировки: ${workout.type}</p>
            <ul>
                ${workout.exercises.map(ex => `
                    <li>${ex.exercise} - Повторения: ${ex.reps}, Подходы: ${ex.sets}</li>
                `).join('')}
            </ul>
        `;
        savedWorkoutsList.appendChild(listItem);
    });
}

// Функция для получения данных тренировки из формы
function getWorkoutData() {
    const workoutData = {
        name: "Тренировка для бицепсов",  // Можешь заменить на данные из формы
        type: "Бицепс и грудь",           // Тип тренировки
        exercises: [
            { exercise: "Подтягивания", reps: 10, sets: 3 },
            { exercise: "Жим штанги", reps: 8, sets: 4 }
        ]
    };
    return workoutData;
}

// Функция для получения текущего ID пользователя
function getCurrentUserId() {
    const user = firebase.auth().currentUser;
    return user ? user.uid : null;
}

// Обработчик сохранения тренировки
document.getElementById('saveWorkout').addEventListener('click', async () => {
    const workoutData = getWorkoutData();  // Собираем данные о тренировке
    const userId = getCurrentUserId();     // Получаем ID текущего пользователя

    if (userId) {
        await saveWorkout(userId, workoutData); // Сохраняем тренировку в Firebase
    } else {
        alert('Пользователь не авторизован!');
    }
});

// Функция для отображения тренировки в списке сохраненных тренировок
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

// Пример функции для генерации тренировок (замени на свою логику)
async function generateWorkout() {
    const trainingType = document.getElementById('trainingType').value;
    const data = await loadExercises();  // Функция для загрузки упражнений из JSON или другого источника
    const workout = data[trainingType] || [];

    if (workout.length === 0) {
        alert("Нет данных для выбранной тренировки!");
        return;
    }

    const workoutContainer = document.getElementById('workoutSuggestions');
    workoutContainer.innerHTML = "";

    workout.forEach((exercise, index) => {
        workoutContainer.innerHTML += `
            <div class="exercise">
                <h4>${index + 1}. ${exercise.exercise}</h4>
                <p>Повторения: ${exercise.reps}, Подходы: ${exercise.sets}</p>
                <p>Тип: ${exercise.type}</p>
                <p>Мышцы: ${exercise.muscles}</p>
                <label for="weight${index}">Вес (кг):</label>
                <input type="number" id="weight${index}" class="weight-input" placeholder="Введите вес" />
            </div>
        `;
    });

    document.getElementById('saveWorkout').style.display = 'block';
}

// Загружаем список упражнений (например, из JSON файла)
async function loadExercises() {
    try {
        const response = await fetch('exercises.json');
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки упражнений:', error);
        return {};
    }
}
