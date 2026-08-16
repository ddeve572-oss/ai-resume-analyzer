import { api } from "../api.js";
import { ui, store } from "../app.js";

export async function renderJobs(container) {
  const analysis = store.latestAnalysis;

  if (!analysis) {
    container.innerHTML = `
      <div class="glass-card text-center" style="max-width: 600px; margin: 40px auto; padding: 40px 20px;">
        <i data-lucide="briefcase" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
        <h2>Upload Resume to Match Jobs</h2>
        <p class="text-secondary" style="margin-bottom: 20px;">We use your resume skills to calculate compatibility scores and recommend matching jobs.</p>
        <a href="#upload" class="btn btn-primary">Go to Upload</a>
      </div>
    `;
    return;
  }

  // Setup layout with filter bar and results viewport
  container.innerHTML = `
    <div class="jobs-layout animate-fade-in">
      
      <!-- Filter Panel -->
      <div class="glass-card jobs-filter-panel">
        
        <div class="filter-input-group" style="flex: 2; min-width: 250px;">
          <label class="form-label" for="search-job">Keyword Search</label>
          <input type="text" id="search-job" class="form-input" placeholder="Search title or company...">
        </div>

        <div class="filter-input-group">
          <label class="form-label" for="filter-location">Location</label>
          <select id="filter-location" class="filter-select">
            <option value="all">All Locations</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="san francisco">San Francisco</option>
            <option value="new york">New York</option>
            <option value="austin">Austin</option>
            <option value="boston">Boston</option>
            <option value="chicago">Chicago</option>
            <option value="seattle">Seattle</option>
          </select>
        </div>

        <div class="filter-input-group">
          <label class="form-label" for="filter-experience">Experience</label>
          <select id="filter-experience" class="filter-select">
            <option value="all">All Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead / Lead Level</option>
          </select>
        </div>

        <div class="filter-input-group">
          <label class="form-label" for="filter-jobtype">Job Type</label>
          <select id="filter-jobtype" class="filter-select">
            <option value="all">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="contract">Contract</option>
            <option value="remote">Remote</option>
          </select>
        </div>

        <button id="btn-search-trigger" class="btn btn-primary" style="height: 43px;">
          <i data-lucide="search"></i>
          <span>Search</span>
        </button>
      </div>

      <!-- Results section -->
      <div id="jobs-results-container" class="jobs-grid">
        <!-- Rendered job cards will appear here -->
      </div>
      
    </div>
  `;

  const searchInput = document.getElementById("search-job");
  const locFilter = document.getElementById("filter-location");
  const expFilter = document.getElementById("filter-experience");
  const typeFilter = document.getElementById("filter-jobtype");
  const searchBtn = document.getElementById("btn-search-trigger");
  const resultsContainer = document.getElementById("jobs-results-container");

  // Load and render jobs
  async function fetchAndRender() {
    resultsContainer.innerHTML = `
      <div class="skeleton-loader glass-card" style="height: 250px;"></div>
      <div class="skeleton-loader glass-card" style="height: 250px;"></div>
      <div class="skeleton-loader glass-card" style="height: 250px;"></div>
    `;

    const filters = {
      search: searchInput.value.trim(),
      location: locFilter.value,
      experienceLevel: expFilter.value,
      jobType: typeFilter.value
    };

    try {
      const jobs = await api.getJobs(filters);
      store.jobs = jobs;
      renderJobCards(jobs);
    } catch (err) {
      ui.showToast(`Failed to fetch jobs: ${err.message}`, "error");
      resultsContainer.innerHTML = `
        <div class="glass-card text-center" style="grid-column: 1 / -1; padding: 40px;">
          <p class="text-secondary">Error loading matching jobs. Please try again.</p>
        </div>
      `;
    }
  }

  function renderJobCards(jobs) {
    if (jobs.length === 0) {
      resultsContainer.innerHTML = `
        <div class="glass-card text-center" style="grid-column: 1 / -1; padding: 60px 40px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <i data-lucide="search-code" style="width: 48px; height: 48px; color: var(--text-muted);"></i>
          <h3>No Jobs Found Matching Your Criteria</h3>
          <p class="text-secondary" style="max-width: 450px;">Try loosening your filters, search term, or upload a resume with more technical skill keywords.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    resultsContainer.innerHTML = jobs.map(job => {
      // Color-code match percentage
      let badgeClass = "badge-success";
      if (job.match_score < 45) badgeClass = "badge-warning";
      if (job.match_score < 25) badgeClass = "badge-primary";

      return `
        <div class="glass-card job-card animate-fade-in" data-job-id="${job.id}">
          <div class="job-match-badge-corner">${job.match_score}% Match</div>
          
          <div class="job-card-header">
            <h3 class="job-card-title">${job.title}</h3>
            <span class="job-card-company">${job.company}</span>
          </div>

          <div class="job-details-meta">
            <div class="job-meta-item">
              <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
              <span>${job.location}</span>
            </div>
            <div class="job-meta-item">
              <i data-lucide="briefcase" style="width: 12px; height: 12px;"></i>
              <span>${job.experience_level}</span>
            </div>
            <div class="job-meta-item">
              <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
              <span>${job.job_type}</span>
            </div>
          </div>

          <p class="job-card-description">${job.description}</p>

          <div class="job-card-skills">
            ${job.skills.slice(0, 4).map(skill => `
              <span class="badge badge-secondary">${skill}</span>
            `).join("")}
            ${job.skills.length > 4 ? `<span class="badge badge-primary">+${job.skills.length - 4} more</span>` : ""}
          </div>

          <div class="job-card-footer">
            <button class="btn btn-secondary btn-sm btn-view-details" data-job-id="${job.id}">
              <span>View Details</span>
              <i data-lucide="maximize-2" style="width: 13px; height: 13px;"></i>
            </button>
            
            <button class="btn-save-job ${job.saved ? "saved" : ""}" data-job-id="${job.id}" title="${job.saved ? "Unsave Job" : "Save Job"}">
              <i data-lucide="heart" style="width: 20px; height: 20px; fill: ${job.saved ? "var(--danger)" : "none"}"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");

    lucide.createIcons();

    // Bind Details Click listeners
    document.querySelectorAll(".btn-view-details").forEach(btn => {
      btn.addEventListener("click", () => {
        const jobId = parseInt(btn.getAttribute("data-job-id"));
        const job = store.jobs.find(j => j.id === jobId);
        if (job) showJobDetailsModal(job);
      });
    });

    // Bind Save Job click listeners
    document.querySelectorAll(".btn-save-job").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const jobId = parseInt(btn.getAttribute("data-job-id"));
        const job = store.jobs.find(j => j.id === jobId);
        if (!job) return;

        try {
          if (job.saved) {
            await api.unsaveJob(jobId);
            job.saved = false;
            btn.classList.remove("saved");
            ui.showToast("Job removed from saved list.", "info");
          } else {
            await api.saveJob(jobId);
            job.saved = true;
            btn.classList.add("saved");
            ui.showToast("Job saved successfully!", "success");
          }
        } catch (err) {
          ui.showToast(`Error toggling save status: ${err.message}`, "error");
        }
      });
    });
  }

  function showJobDetailsModal(job) {
    const modalHtml = `
      <div class="job-detail-view">
        <div class="job-detail-header">
          <h2 class="job-detail-title">${job.title}</h2>
          <span class="job-detail-company">${job.company}</span>
          
          <div class="job-detail-meta-list">
            <span class="badge badge-teal">
              <i data-lucide="map-pin" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle;"></i>
              ${job.location}
            </span>
            <span class="badge badge-primary">
              <i data-lucide="briefcase" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle;"></i>
              ${job.experience_level} Experience
            </span>
            <span class="badge badge-secondary">
              <i data-lucide="clock" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: middle;"></i>
              ${job.job_type}
            </span>
          </div>
        </div>

        <div>
          <h4 class="job-detail-section-title">Job Description</h4>
          <p class="job-detail-body-text">${job.description}</p>
        </div>

        <div>
          <h4 class="job-detail-section-title">Requirements & Experience</h4>
          <p class="job-detail-body-text">${job.requirements}</p>
        </div>

        <div>
          <h4 class="job-detail-section-title">Required Skills Matrix</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
            ${job.skills.map(skill => `
              <span class="badge badge-secondary" style="font-size: 12px; padding: 6px 12px;">${skill}</span>
            `).join("")}
          </div>
        </div>

        <div style="display: flex; gap: 16px; margin-top: 20px; border-top: 1px solid var(--card-border); padding-top: 20px;">
          <a href="${job.apply_url}" target="_blank" class="btn btn-primary" style="flex-grow: 1;">
            <span>Apply Now</span>
            <i data-lucide="external-link"></i>
          </a>
          <a href="#gap?job=${job.id}" class="btn btn-secondary" onclick="ui.closeModal()">
            <i data-lucide="git-pull-request"></i>
            <span>Inspect Skill Gaps</span>
          </a>
        </div>
      </div>
    `;
    ui.openModal(modalHtml);
  }

  // Trigger search on button click
  searchBtn.addEventListener("click", fetchAndRender);

  // Trigger search on enter key inside input
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") fetchAndRender();
  });

  // Initial fetch and render
  await fetchAndRender();
}
