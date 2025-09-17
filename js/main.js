import { checkUserSession, login, register, logout } from "./auth.js";
import { loadDashboard } from "./dashboard.js";

document.addEventListener("DOMContentLoaded", async () => {
  const authContainer = document.getElementById("auth-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const logoutBtn = document.getElementById("logout-btn");
  const showRegisterLink = document.getElementById("show-register-link");
  const showLoginLink = document.getElementById("show-login-link");
  const authErrorEl = document.getElementById("auth-error");
  const registerMessageEl = document.getElementById("register-message");
  const userEmailDisplay = document.getElementById("user-email-display");

  // Verificar sessão do usuário
  const user = await checkUserSession();
  
  if (user) {
    // Se o usuário está logado, esconde a autenticação e carrega o dashboard
    authContainer.classList.add("hidden");
    dashboardContainer.classList.remove("hidden");
    userEmailDisplay.textContent = `Logado como: ${user.email}`;
    await loadDashboard(user); // << ESSA LINHA FOI RESTAURADA
  } else {
    // Se não está logado, mostra a tela de autenticação
    dashboardContainer.classList.add("hidden");
    authContainer.classList.remove("hidden");
  }

  // Evento de Login
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

  // Evento de Registro
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

  // Evento de Logout
  logoutBtn.addEventListener("click", async () => {
    await logout();
    location.reload();
  });

  // Links para alternar entre login e registro
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
