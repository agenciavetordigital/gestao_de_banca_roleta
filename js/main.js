import { checkUserSession, login, register } from "./auth.js";
import { loadDashboard } from "./dashboard.js";

document.addEventListener("DOMContentLoaded", async () => {
  const authContainer = document.getElementById("auth-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const showRegisterLink = document.getElementById("show-register-link");
  const showLoginLink = document.getElementById("show-login-link");
  const authErrorEl = document.getElementById("auth-error");
  const registerMessageEl = document.getElementById("register-message");

  const user = await checkUserSession();
  
  if (user) {
    authContainer.classList.add("hidden");
    dashboardContainer.classList.remove("hidden");
    await loadDashboard(user);
  } else {
    dashboardContainer.classList.add("hidden");
    authContainer.classList.remove("hidden");
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authErrorEl.textContent = "";
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const { error } = await login(email, password);
    if (error) {
      authErrorEl.textContent = "Email ou senha inválidos.";
    } else {
      location.reload();
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    registerMessageEl.textContent = "";
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const { error } = await register(email, password);
    if (error) {
      alert(`Erro ao cadastrar: ${error.message}`);
    } else {
      registerMessageEl.textContent = "Cadastro realizado! Verifique seu e-mail para confirmar a conta.";
    }
  });
  
  showRegisterLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("login-view").classList.add("hidden");
    document.getElementById("register-view").classList.remove("hidden");
  });

  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("register-view").classList.add("hidden");
    document.getElementById("login-view").classList.remove("hidden");
  });
});
