import { api } from "../api.js";
import { ui } from "../app.js";

export function renderLanding(container) {
  const authenticated = api.isAuthenticated();

  container.innerHTML = `
    <div class="landing-hero animate-fade-in">
      <div class="hero-tag">Powered by Google Gemini 1.5 Flash</div>
      <h1 class="hero-title">Optimize Your Resume.<br>Land Your <span class="brand-accent">Dream Job.</span></h1>
      <p class="hero-subtitle">
        Upload your resume for an instant AI-powered ATS scoring, detailed formatting audit, semantic job matching, skill gap analysis, and tailored learning roadmaps.
      </p>
      
      <div class="hero-actions">
        ${authenticated ? `
          <a href="#upload" class="btn btn-primary">
            <i data-lucide="file-up"></i>
            <span>Upload Your Resume</span>
          </a>
          <a href="#dashboard" class="btn btn-secondary">
            <span>View Dashboard</span>
            <i data-lucide="arrow-right"></i>
          </a>
        ` : `
          <a href="#register" class="btn btn-primary">
            <span>Sign Up / Create Account</span>
            <i data-lucide="user-plus"></i>
          </a>
          <button id="btn-demo-sandbox" class="btn btn-secondary">
            <span>Try Guest Demo Sandbox</span>
            <i data-lucide="play"></i>
          </button>
        `}
      </div>
    </div>

    <div class="features-grid">
      <div class="glass-card feature-card">
        <div class="feature-icon">
          <i data-lucide="cpu"></i>
        </div>
        <h3 class="feature-title">AI Resume Analysis</h3>
        <p class="feature-desc">
          Google Gemini extracts contact details, education, professional experience, certifications, and skills into a standardized clean JSON.
        </p>
      </div>

      <div class="glass-card feature-card">
        <div class="feature-icon">
          <i data-lucide="bar-chart-3"></i>
        </div>
        <h3 class="feature-title">ATS Score Dashboard</h3>
        <p class="feature-desc">
          Receive an overall ATS-compatibility rating from 0-100, parsed by formatting, keyword density, and bullet point impact statements.
        </p>
      </div>

      <div class="glass-card feature-card">
        <div class="feature-icon">
          <i data-lucide="briefcase"></i>
        </div>
        <h3 class="feature-title">Semantic Job Matching</h3>
        <p class="feature-desc">
          Compare your technical skills and past experience against pre-seeded jobs to discover roles you are already competitive for.
        </p>
      </div>

      <div class="glass-card feature-card">
        <div class="feature-icon">
          <i data-lucide="git-pull-request"></i>
        </div>
        <h3 class="feature-title">Skill Gap Analysis</h3>
        <p class="feature-desc">
          Pick a target job and view an interactive radar chart comparison highlighting matching skills vs. required skills.
        </p>
      </div>

      <div class="glass-card feature-card">
        <div class="feature-icon">
          <i data-lucide="graduation-cap"></i>
        </div>
        <h3 class="feature-title">Learning Roadmaps</h3>
        <p class="feature-desc">
          Close identified skill gaps with targeted course recommendations pointing to platforms like Udemy, Coursera, and freeCodeCamp.
        </p>
      </div>
    </div>
  `;

  // Attach event listener for guest sandbox demo
  if (!authenticated) {
    const demoBtn = document.getElementById("btn-demo-sandbox");
    if (demoBtn) {
      demoBtn.addEventListener("click", async () => {
        ui.showLoading("Creating sandbox session...", "Setting up default workspace");
        try {
          // Log in with guest account or create one
          const guestEmail = `guest_${Math.floor(Math.random() * 100000)}@resumatch.demo`;
          const guestPassword = "guestPassword123";
          
          await api.register(guestEmail, guestPassword, "Sandbox Guest User");
          ui.hideLoading();
          ui.showToast("Logged in as guest demo user!", "success");
          window.location.hash = "#upload";
        } catch (error) {
          // If registration fails because we hit some error, try logging in to generic demo account
          try {
            await api.login("guest@resumatch.demo", "guestPassword123");
            ui.hideLoading();
            ui.showToast("Welcome back to the guest demo!", "success");
            window.location.hash = "#upload";
          } catch (loginErr) {
            ui.hideLoading();
            ui.showToast(`Sandbox creation failed: ${error.message}`, "error");
          }
        }
      });
    }
  }
}
