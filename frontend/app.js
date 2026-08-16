import { api } from "./api.js";

// View Component Imports
import { renderLanding } from "./components/LandingView.js";
import { renderAuth } from "./components/AuthView.js";
import { renderUpload } from "./components/UploadView.js";
import { renderDashboard } from "./components/DashboardView.js";
import { renderSkills } from "./components/SkillsView.js";
import { renderJobs } from "./components/JobsView.js";
import { renderSkillGap } from "./components/SkillGapView.js";
import { renderLearning } from "./components/LearningView.js";
import { renderProfile } from "./components/ProfileView.js";

// Global App State
export const store = {
  user: api.getUser(),
  latestAnalysis: null,
  jobs: [],
  savedJobs: [],
  theme: localStorage.getItem("theme") || "dark-theme"
};

// Global UI Helper Functions
export const ui = {
  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let iconName = "info";
    if (type === "success") iconName = "check-circle";
    if (type === "error") iconName = "alert-triangle";
    if (type === "warning") iconName = "alert-circle";

    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    lucide.createIcons();

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      toast.style.animation = "toastSlideIn 0.3s reverse forwards";
      toast.addEventListener("animationend", () => {
        toast.remove();
      });
    }, 4000);
  },

  showLoading(statusText = "Processing...", subText = "Please wait a moment") {
    // Check if loading overlay already exists
    let overlay = document.getElementById("global-loading-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "global-loading-overlay";
      overlay.className = "loading-overlay-fullscreen";
      overlay.innerHTML = `
        <div class="spinner-circle"></div>
        <div class="loading-status-text" id="loading-status-msg"></div>
        <div class="loading-subtext" id="loading-subtext-msg"></div>
      `;
      document.body.appendChild(overlay);
    }
    document.getElementById("loading-status-msg").textContent = statusText;
    document.getElementById("loading-subtext-msg").textContent = subText;
    overlay.style.display = "flex";
  },

  hideLoading() {
    const overlay = document.getElementById("global-loading-overlay");
    if (overlay) {
      overlay.style.display = "none";
    }
  },

  openModal(bodyHtml) {
    const modal = document.getElementById("modal-container");
    const body = document.getElementById("modal-body");
    if (!modal || !body) return;

    body.innerHTML = bodyHtml;
    modal.classList.remove("hidden");
    lucide.createIcons();
    
    // Lock background scroll
    document.body.style.overflow = "hidden";
  },

  closeModal() {
    const modal = document.getElementById("modal-container");
    if (modal) {
      modal.classList.add("hidden");
    }
    document.body.style.overflow = "auto";
  }
};

// Router Mapping
const routes = {
  landing: { title: "Welcome to ResuMatch AI", render: renderLanding, protected: false },
  login: { title: "Access Gateway", render: renderAuth, protected: false },
  register: { title: "Create Account", render: renderAuth, protected: false },
  upload: { title: "Upload Resume", render: renderUpload, protected: true },
  dashboard: { title: "Resume Score Dashboard", render: renderDashboard, protected: true },
  skills: { title: "Skills Detected", render: renderSkills, protected: true },
  jobs: { title: "Recommended Jobs", render: renderJobs, protected: true },
  gap: { title: "Skill Gap Analysis", render: renderSkillGap, protected: true },
  learning: { title: "Personalized Learning Paths", render: renderLearning, protected: true },
  profile: { title: "Profile Settings", render: renderProfile, protected: true }
};

// Route Handler
async function route() {
  const hash = window.location.hash.slice(1) || "landing";
  let [page, arg] = hash.split("?"); // Support hash query params if needed
  
  // Normalize page name
  if (page === "auth" || page === "signup") page = "register";
  
  const targetRoute = routes[page];
  
  if (!targetRoute) {
    window.location.hash = "#landing";
    return;
  }

  // Auth Guard
  const authenticated = api.isAuthenticated();
  if (targetRoute.protected && !authenticated) {
    ui.showToast("Please log in to access this page.", "warning");
    window.location.hash = "#login";
    return;
  }

  // Update navbar layout state (Gate vs Main App Layout)
  const appContainer = document.getElementById("app-container");
  const authContainer = document.getElementById("auth-container");

  if (authenticated && page !== "landing" && page !== "login" && page !== "register") {
    // Show Main Dashboard Layout
    appContainer.classList.remove("layout-hidden");
    authContainer.style.display = "none";
    
    // Update active nav link
    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.remove("active");
    });
    const activeNav = document.getElementById(`nav-${page}`);
    if (activeNav) activeNav.classList.add("active");
    
    // Update user profile badge
    const user = api.getUser();
    if (user) {
      document.getElementById("user-display-name").textContent = user.full_name;
      document.getElementById("user-display-email").textContent = user.email;
      
      // Initials avatar
      const initials = user.full_name
        .split(" ")
        .map(n => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      document.getElementById("user-avatar-initials").textContent = initials || "US";
    }
  } else {
    // Show landing/auth layout (Hide sidebar)
    appContainer.classList.add("layout-hidden");
    authContainer.style.display = "flex";
  }

  // Set Document Title and page title heading
  document.title = `${targetRoute.title} | ResuMatch AI`;
  const pageTitleElement = document.getElementById("page-title");
  if (pageTitleElement) {
    pageTitleElement.textContent = targetRoute.title;
  }

  // Close sidebar on mobile after navigating
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("mobile-open");

  // Render Page Content
  const container = authenticated && page !== "landing" && page !== "login" && page !== "register" 
    ? document.getElementById("viewport") 
    : authContainer;

  // Cache/Fetch Latest Resume Analysis if logged in and not already in store
  if (authenticated && !store.latestAnalysis) {
    try {
      const cached = localStorage.getItem("latestAnalysis");
      if (cached) {
        store.latestAnalysis = JSON.parse(cached);
      } else {
        const latest = await api.getLatestResume();
        if (latest) {
          store.latestAnalysis = latest.analysis;
          localStorage.setItem("latestAnalysis", JSON.stringify(latest.analysis));
        }
      }
    } catch (e) {
      console.warn("Could not retrieve latest resume score:", e);
    }
  }

  // Render the target view
  try {
    await targetRoute.render(container);
  } catch (error) {
    console.error(`Error rendering view ${page}:`, error);
    container.innerHTML = `
      <div class="glass-card error-card">
        <h2>Something went wrong</h2>
        <p>${error.message || "Failed to load view contents."}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Reload Application</button>
      </div>
    `;
  }

  // Re-run icon replacements
  lucide.createIcons();
}

// App Initialization
function init() {
  // Theme initialization
  document.body.className = store.theme;
  
  // Theme Toggle listener
  const themeToggleBtn = document.getElementById("theme-toggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      store.theme = store.theme === "dark-theme" ? "light-theme" : "dark-theme";
      document.body.className = store.theme;
      localStorage.setItem("theme", store.theme);
      ui.showToast(`Switched to ${store.theme === "dark-theme" ? "Dark" : "Light"} Mode`, "info");
    });
  }

  // Mobile sidebar burger listener
  const mobileToggle = document.getElementById("mobile-toggle");
  const sidebar = document.getElementById("sidebar");
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("mobile-open");
    });
  }

  // Logout button listener
  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      api.logout();
      store.user = null;
      store.latestAnalysis = null;
      store.jobs = [];
      store.savedJobs = [];
      ui.showToast("Logged out successfully.", "success");
      window.location.hash = "#landing";
    });
  }

  // Modal close listener
  const modalClose = document.getElementById("modal-close");
  const modalContainer = document.getElementById("modal-container");
  if (modalClose && modalContainer) {
    modalClose.addEventListener("click", ui.closeModal);
    modalContainer.addEventListener("click", (e) => {
      if (e.target === modalContainer) ui.closeModal();
    });
  }

  // Listen to hash routes
  window.addEventListener("hashchange", route);
  
  // Trigger initial route
  route();
}

// Run init on DOM load
window.addEventListener("DOMContentLoaded", init);
