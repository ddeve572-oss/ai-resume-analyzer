import { api } from "../api.js";
import { ui, store } from "../app.js";

export function renderAuth(container) {
  const hash = window.location.hash.slice(1);
  const isRegister = hash === "register";

  container.innerHTML = `
    <div class="glass-card auth-card animate-fade-in">
      <div class="auth-header">
        <div class="auth-logo">
          <i data-lucide="cpu" style="width: 32px; height: 32px;"></i>
          <span class="brand-name">ResuMatch <span class="brand-accent">AI</span></span>
        </div>
        <h2 class="auth-title">${isRegister ? "Create Your Account" : "Access Your Dashboard"}</h2>
        <p class="auth-subtitle">${isRegister ? "Start analyzing resumes and finding matched jobs" : "Welcome back! Log in to continue"}</p>
      </div>

      <div class="auth-tabs">
        <div class="auth-tab ${!isRegister ? "active" : ""}" id="tab-login-btn">Log In</div>
        <div class="auth-tab ${isRegister ? "active" : ""}" id="tab-register-btn">Sign Up</div>
      </div>

      <form id="auth-form" class="auth-form-layout">
        ${isRegister ? `
          <div class="form-group">
            <label class="form-label" for="auth-fullname">Full Name</label>
            <input type="text" id="auth-fullname" class="form-input" placeholder="e.g. John Doe" required autocomplete="name">
          </div>
        ` : ""}
        
        <div class="form-group">
          <label class="form-label" for="auth-email">Email Address</label>
          <input type="email" id="auth-email" class="form-input" placeholder="e.g. john@example.com" required autocomplete="email">
        </div>

        <div class="form-group">
          <label class="form-label" for="auth-password">Password</label>
          <input type="password" id="auth-password" class="form-input" placeholder="Minimum 6 characters" required autocomplete="current-password">
        </div>

        ${isRegister ? `
          <div class="form-group">
            <label class="form-label" for="auth-confirm-password">Confirm Password</label>
            <input type="password" id="auth-confirm-password" class="form-input" placeholder="Re-enter password" required autocomplete="new-password">
          </div>
        ` : ""}

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
          <span>${isRegister ? "Create Account" : "Sign In"}</span>
          <i data-lucide="arrow-right"></i>
        </button>
      </form>

      <p class="auth-footer-text">
        ${isRegister 
          ? `Already have an account? <span class="auth-link" id="link-login">Log In</span>` 
          : `Don't have an account? <span class="auth-link" id="link-register">Sign Up</span>`
        }
      </p>
    </div>
  `;

  // Attach Event Listeners
  const tabLogin = document.getElementById("tab-login-btn");
  const tabRegister = document.getElementById("tab-register-btn");
  const linkLogin = document.getElementById("link-login");
  const linkRegister = document.getElementById("link-register");

  const switchPage = (hashName) => {
    window.location.hash = `#${hashName}`;
  };

  if (tabLogin) tabLogin.addEventListener("click", () => switchPage("login"));
  if (tabRegister) tabRegister.addEventListener("click", () => switchPage("register"));
  if (linkLogin) linkLogin.addEventListener("click", () => switchPage("login"));
  if (linkRegister) linkRegister.addEventListener("click", () => switchPage("register"));

  // Form submission handler
  const form = document.getElementById("auth-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const email = document.getElementById("auth-email").value.trim();
      const password = document.getElementById("auth-password").value;
      
      if (password.length < 6) {
        ui.showToast("Password must be at least 6 characters long.", "error");
        return;
      }

      if (isRegister) {
        const fullName = document.getElementById("auth-fullname").value.trim();
        const confirmPassword = document.getElementById("auth-confirm-password").value;
        
        if (!fullName) {
          ui.showToast("Please provide your full name.", "error");
          return;
        }

        if (password !== confirmPassword) {
          ui.showToast("Passwords do not match.", "error");
          return;
        }

        ui.showLoading("Registering account...", "Configuring cloud workspace");
        try {
          const authData = await api.register(email, password, fullName);
          store.user = authData.user;
          ui.hideLoading();
          ui.showToast("Welcome to ResuMatch AI!", "success");
          window.location.hash = "#upload";
        } catch (error) {
          ui.hideLoading();
          ui.showToast(`Registration failed: ${error.message}`, "error");
        }
      } else {
        ui.showLoading("Signing in...", "Verifying security credentials");
        try {
          const authData = await api.login(email, password);
          store.user = authData.user;
          ui.hideLoading();
          ui.showToast("Sign in successful!", "success");
          window.location.hash = "#dashboard";
        } catch (error) {
          ui.hideLoading();
          ui.showToast(`Sign in failed: ${error.message}`, "error");
        }
      }
    });
  }
}
