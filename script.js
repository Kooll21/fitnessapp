function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    document.getElementById(sectionId).style.display = 'block';
}
function generateWorkout() {
    const trainingType = document.getElementById("trainingType").value;
    const workoutSuggestions = document.getElementById("workoutSuggestions");
    const saveButton = document.getElementById("saveWorkout");

    if (!workoutDatabase[trainingType] || workoutDatabase[trainingType].length === 0) {
        workoutSuggestions.innerHTML = "<p>Нет доступных упражнений для этой тренировки.</p>";
        saveButton.style.display = "none";
        return;
    }

    const selectedWorkout = workoutDatabase[trainingType][Math.floor(Math.random() * workoutDatabase[trainingType].length)];
    
    let workoutHTML = "<h3>Ваши упражнения:</h3><ul>";
    selectedWorkout.forEach(exercise => {
        workoutHTML += `<li><strong>${exercise.exercise}</strong> — ${exercise.reps} повторений, ${exercise.sets} подходов <br><em>${exercise.muscles}</em></li>`;
    });
    workoutHTML += "</ul>";

    workoutSuggestions.innerHTML = workoutHTML;
    saveButton.style.display = "block";
}
