// admin.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";

// Firebase initialization
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

document.addEventListener("DOMContentLoaded", () => {
  fetch('menu.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById("navbar-container").innerHTML = html;
      checkAuthState();
      initBurgerMenu();
    })
    .catch(err => {
      console.error("Error loading menu:", err);
      document.getElementById("navbar-container").innerHTML = `
        <span id="user-status">Please log in</span>
        <a href="login.html" id="login-link">Login</a>
        <button onclick="logoutUser()" id="logout-btn" style="display:none;">Logout</button>`;
      checkAuthState();
    });
});

// Authentication state check
function checkAuthState() {
  const adminButton = document.getElementById("admin-panel");
  const userStatus = document.getElementById("user-status");
  const loginLink = document.getElementById("login-link");
  const logoutBtn = document.getElementById("logout-btn");

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      userStatus.textContent = `Welcome, ${user.email}`;
      loginLink.style.display = 'none';
      logoutBtn.style.display = 'block';
      adminButton.style.display = 'block';
      await loadUserWorkouts(user.uid);
    } else {
      userStatus.textContent = 'Please log in';
      loginLink.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      adminButton.style.display = 'none';
    }
  });
}

window.logoutUser = function() {
  signOut(auth)
    .then(() => {
      document.getElementById("user-status").textContent = 'Please log in';
      document.getElementById("login-link").style.display = 'inline-block';
      document.getElementById("logout-btn").style.display = 'none';
      document.getElementById("admin-panel").style.display = 'none';
    })
    .catch((error) => {
      console.error('Error logging out:', error);
    });
};

// Load workouts for the user
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

// Load exercises for a workout
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

// Display workouts
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

// Show workout details in a popup
window.showWorkoutDetails = function(index) {
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
};

// Function to close popup
window.closePopup = function() {
  document.body.classList.remove("modal-open");
  document.getElementById("overlay").style.display = "none";
  document.getElementById("popup").style.display = "none";
};
