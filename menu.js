// menu.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";

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

// Firebase authentication state listener
document.addEventListener("DOMContentLoaded", function () {
  const adminButton = document.getElementById("admin-panel-btn");
  const userStatus = document.getElementById("user-status");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is logged in
      userStatus.textContent = `Welcome, ${user.email}`;
      adminButton.style.display = 'block'; // Show the button
    } else {
      // User is logged out
      userStatus.textContent = 'Please log in';
      adminButton.style.display = 'none'; // Hide the button
    }
  });
});
