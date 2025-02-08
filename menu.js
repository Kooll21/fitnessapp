import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCIXtcjkj6kLTqwStdD7RtMCuiycrKBH0k",
  authDomain: "fitnessapp-f519f.firebaseapp.com",
  projectId: "fitnessapp-f519f",
  storageBucket: "fitnessapp-f519f.appspot.com",
  messagingSenderId: "1000735476286",
  appId: "1:1000735476286:web:4a62a875917834dd215f6f",
  measurementId: "G-MJ8K8ZNQM4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Ensure script runs after menu is loaded
document.addEventListener("DOMContentLoaded", () => {
  const userStatus = document.getElementById("user-status");
  const loginLink = document.getElementById("login-link");
  const logoutBtn = document.getElementById("logout-btn");
  const adminPanel = document.getElementById("admin-panel");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      userStatus.textContent = `Welcome, ${user.email}`;
      loginLink.style.display = "none";
      logoutBtn.style.display = "block";
      adminPanel.style.display = "block"; // Show admin panel
    } else {
      userStatus.textContent = "Please log in";
      loginLink.style.display = "inline-block";
      logoutBtn.style.display = "none";
      adminPanel.style.display = "none"; // Hide admin panel
    }
  });

  // Log out function
  window.logoutUser = function () {
    signOut(auth).then(() => {
      userStatus.textContent = "Please log in";
      loginLink.style.display = "inline-block";
      logoutBtn.style.display = "none";
      adminPanel.style.display = "none";
    }).catch((error) => {
      console.error("Error logging out user:", error);
    });
  };
});
