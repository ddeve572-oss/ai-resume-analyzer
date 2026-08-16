import { api } from "../api.js";
import { ui, store } from "../app.js";

export async function renderProfile(container) {
  const user = api.getUser();
  if (!user) return;

  // Retrieve user settings (e.g. custom API Key)
  const settings = JSON.parse(localStorage.getItem("userSettings") || "{}");
  const geminiApiKey = settings.geminiApiKey || "";

  // Set initial loading skeleton layout
  container.innerHTML = `
    <div class="profile-grid animate-fade-in">
      
      <!-- Left Column: Settings and API keys configuration -->
      <div class="profile-settings-panel">
        <div class="glass-card">
          <div style="border-bottom: 1px solid var(--card-border); padding-bottom: 15px; margin-bottom: 20px;">
            <h3 style="font-size: 16px; font-weight: 600;">Personal Information</h3>
          </div>
          <div class="form-group">
            <span class="form-label">Full Name</span>
            <div style="font-size: 15px; font-weight: 500; margin-top: 4px;">${user.full_name}</div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <span class="form-label">Email Address</span>
            <div style="font-size: 15px; font-weight: 500; margin-top: 4px;">${user.email}</div>
          </div>
        </div>

        <div class="glass-card">
          <div style="border-bottom: 1px solid var(--card-border); padding-bottom: 15px; margin-bottom: 20px;">
            <h3 style="font-size: 16px; font-weight: 600;">LLM Integration Settings</h3>
            <p class="text-muted" style="font-size: 12px; margin-top: 4px;">Provide your own Google Gemini API Key for custom parsing and ATS scoring.</p>
          </div>
          
          <form id="settings-key-form">
            <div class="form-group">
              <label class="form-label" for="settings-api-key">Gemini API Key</label>
              <input type="password" id="settings-api-key" class="form-input" placeholder="Paste your API key here..." value="${geminiApiKey}">
            </div>
            <button type="submit" class="btn btn-primary btn-sm" style="width: 100%;">Save Settings</button>
          </form>
        </div>
      </div>

      <!-- Right Column: Saved jobs and Resume history -->
      <div style="display: flex; flex-direction: column; gap: 30px;">
        
        <!-- Saved Jobs Board -->
        <div class="glass-card">
          <div style="border-bottom: 1px solid var(--card-border); padding-bottom: 15px; margin-bottom: 20px;">
            <h3 style="font-size: 16px; font-weight: 600;">Saved Opportunities</h3>
          </div>
          <div id="profile-saved-jobs" class="history-list">
            <div class="skeleton-loader skeleton-text skeleton-text-lg"></div>
            <div class="skeleton-loader skeleton-text skeleton-text-md"></div>
          </div>
        </div>

        <!-- Resume Upload History -->
        <div class="glass-card">
          <div style="border-bottom: 1px solid var(--card-border); padding-bottom: 15px; margin-bottom: 20px;">
            <h3 style="font-size: 16px; font-weight: 600;">Resume Upload History</h3>
            <p class="text-muted" style="font-size: 12px; margin-top: 4px;">Switch between past resume reports to review scores and matching stats</p>
          </div>
          <div id="profile-resume-history" class="history-list">
            <div class="skeleton-loader skeleton-text skeleton-text-lg"></div>
            <div class="skeleton-loader skeleton-text skeleton-text-md"></div>
          </div>
        </div>

      </div>

    </div>
  `;

  // Bind Settings key save form
  const keyForm = document.getElementById("settings-key-form");
  const keyInput = document.getElementById("settings-api-key");
  
  keyForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newKey = keyInput.value.trim();
    const currentSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
    currentSettings.geminiApiKey = newKey;
    localStorage.setItem("userSettings", JSON.stringify(currentSettings));
    ui.showToast("Settings updated successfully!", "success");
  });

  // Load and render Saved Jobs
  async function loadSavedJobs() {
    const container = document.getElementById("profile-saved-jobs");
    try {
      const savedJobs = await api.getSavedJobs();
      store.savedJobs = savedJobs;
      
      if (savedJobs.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13.5px;">
            <i data-lucide="heart" style="width: 20px; height: 20px; margin-bottom: 8px; stroke-width: 1.5px;"></i>
            <p>You haven't saved any job opportunities yet.</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      container.innerHTML = savedJobs.map(job => `
        <div class="history-item animate-fade-in" style="padding: 12px 16px;">
          <div class="history-info">
            <span class="history-filename" style="font-size: 14px;">${job.title}</span>
            <span class="history-date" style="font-size: 12px; color: var(--primary); font-weight: 500;">${job.company} — ${job.location}</span>
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center;">
            <a href="#jobs" class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-size: 12px;">
              <span>View Matches</span>
            </a>
            <button class="btn btn-icon btn-unsave-job" data-job-id="${job.id}" style="width: 32px; height: 32px; color: var(--danger); background: var(--danger-glow); border-color: rgba(239, 68, 68, 0.2);" title="Remove Saved Opportunity">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>
      `).join("");

      lucide.createIcons();

      // Bind unsave buttons click
      container.querySelectorAll(".btn-unsave-job").forEach(btn => {
        btn.addEventListener("click", async () => {
          const jobId = parseInt(btn.getAttribute("data-job-id"));
          try {
            await api.unsaveJob(jobId);
            ui.showToast("Removed from saved opportunities.", "info");
            // Reload list
            loadSavedJobs();
          } catch (e) {
            ui.showToast(`Error unsaving: ${e.message}`, "error");
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<p class="text-secondary" style="font-size: 13px;">Error loading saved jobs.</p>`;
    }
  }

  // Load and render Resume history
  async function loadResumeHistory() {
    const container = document.getElementById("profile-resume-history");
    try {
      const history = await api.getResumeHistory();
      
      if (history.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13.5px;">
            <i data-lucide="file-text" style="width: 20px; height: 20px; margin-bottom: 8px; stroke-width: 1.5px;"></i>
            <p>No past resume uploads found.</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      container.innerHTML = history.map(item => {
        const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return `
          <div class="history-item animate-fade-in">
            <div class="history-info">
              <span class="history-filename">${item.file_name}</span>
              <span class="history-date">${formattedDate}</span>
            </div>
            
            <div class="history-score-badge" style="display: flex; align-items: center;">
              <span class="history-score-num" style="margin-right: 10px;">${item.score} ATS</span>
              <button class="btn btn-primary btn-sm btn-load-past-analysis" data-resume-id="${item.id}" style="padding: 6px 12px; font-size: 12px; margin-right: 6px;">
                <span>Review</span>
                <i data-lucide="chevron-right" style="width: 13px; height: 13px;"></i>
              </button>
              <button class="btn btn-icon btn-delete-resume" data-resume-id="${item.id}" style="width: 32px; height: 32px; color: var(--danger); background: var(--danger-glow); border-color: rgba(239, 68, 68, 0.2);" title="Delete Resume Analysis">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </div>
        `;
      }).join("");

      lucide.createIcons();

      // Bind Load analysis buttons
      container.querySelectorAll(".btn-load-past-analysis").forEach(btn => {
        btn.addEventListener("click", async () => {
          const resumeId = btn.getAttribute("data-resume-id");
          ui.showLoading("Loading report...", "Rebuilding resume scores");
          
          try {
            const res = await fetch(`/api/resume/${resumeId}`, {
              method: "GET",
              headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.detail || "Could not retrieve report.");
            
            // Set as active report
            store.latestAnalysis = data.analysis;
            localStorage.setItem("latestAnalysis", JSON.stringify(data.analysis));
            
            ui.hideLoading();
            ui.showToast(`Active report switched to ${data.file_name}!`, "success");
            window.location.hash = "#dashboard";
          } catch (e) {
            ui.hideLoading();
            ui.showToast(`Error switching report: ${e.message}`, "error");
          }
        });
      });

      // Bind Delete resume buttons
      container.querySelectorAll(".btn-delete-resume").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const resumeId = btn.getAttribute("data-resume-id");
          if (!confirm("Are you sure you want to delete this resume report? This will remove all calculated score history.")) return;

          ui.showLoading("Deleting report...", "Removing records from database");
          try {
            await api.deleteResume(resumeId);
            
            // Reset local cache store and retrieve next best latest resume
            store.latestAnalysis = null;
            localStorage.removeItem("latestAnalysis");
            
            const latest = await api.getLatestResume();
            if (latest) {
              store.latestAnalysis = latest.analysis;
              localStorage.setItem("latestAnalysis", JSON.stringify(latest.analysis));
            }
            
            ui.hideLoading();
            ui.showToast("Resume report deleted successfully.", "success");
            
            // Reload history list
            loadResumeHistory();
          } catch (err) {
            ui.hideLoading();
            ui.showToast(`Error deleting: ${err.message}`, "error");
          }
        });
      });

    } catch (err) {
      container.innerHTML = `<p class="text-secondary" style="font-size: 13px;">Error loading upload history.</p>`;
    }
  }

  // Load both dashboards
  loadSavedJobs();
  loadResumeHistory();
}
