import { store } from "../app.js";

export function renderDashboard(container) {
  const analysis = store.latestAnalysis;

  if (!analysis) {
    container.innerHTML = `
      <div class="glass-card text-center" style="max-width: 600px; margin: 40px auto; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 50px 30px;">
        <div class="feature-icon" style="color: var(--primary); background: var(--primary-glow); width: 64px; height: 64px; border-radius: 50%;">
          <i data-lucide="file-warning" style="width: 32px; height: 32px;"></i>
        </div>
        <h2>No Resume Analyzed Yet</h2>
        <p class="text-secondary" style="line-height: 1.6;">
          Before you can see your ATS score dashboard, skills profile, job matches, and skill gaps, you need to upload your resume for AI processing.
        </p>
        <a href="#upload" class="btn btn-primary">
          <i data-lucide="file-up"></i>
          <span>Upload Resume Now</span>
        </a>
      </div>
    `;
    return;
  }

  const scores = analysis.score_breakdown || {
    overall: 60,
    formatting: 60,
    content_quality: 60,
    keyword_relevance: 60,
    impact_statements: 60
  };

  const feedback = analysis.feedback || {
    formatting: ["No formatting feedback available."],
    content_quality: ["No content quality feedback available."],
    keyword_relevance: ["No keyword feedback available."],
    impact_statements: ["No impact statement feedback available."]
  };

  container.innerHTML = `
    <div class="dashboard-grid animate-fade-in">
      
      <!-- Left Column: Score radial ring and category list -->
      <div style="display: flex; flex-direction: column; gap: 30px;">
        <div class="glass-card score-radial-card">
          <div class="radial-score-container">
            <svg class="radial-score-svg" viewBox="0 0 180 180">
              <circle class="radial-score-bg" cx="90" cy="90" r="80"></circle>
              <circle id="dashboard-score-ring" class="radial-score-meter" cx="90" cy="90" r="80" stroke-dasharray="502" stroke-dashoffset="502"></circle>
              <defs>
                <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="var(--primary)"></stop>
                  <stop offset="100%" stop-color="var(--secondary)"></stop>
                </linearGradient>
              </defs>
            </svg>
            <div class="radial-score-number" id="dashboard-score-num">0</div>
          </div>
          <div class="radial-score-label">Overall ATS Score</div>
          
          <div class="hero-actions" style="margin-top: 10px;">
            <a href="#jobs" class="btn btn-primary btn-sm">
              <i data-lucide="briefcase"></i>
              <span>Match Jobs</span>
            </a>
            <a href="#gap" class="btn btn-secondary btn-sm">
              <i data-lucide="git-pull-request"></i>
              <span>Analyze Gaps</span>
            </a>
          </div>
        </div>

        <div class="glass-card">
          <h3 style="margin-bottom: 20px; font-size: 16px;">Category Scores</h3>
          
          <div class="breakdown-list">
            <div class="breakdown-item">
              <div class="breakdown-label-row">
                <span class="breakdown-label">Formatting & Structure</span>
                <span class="breakdown-val">${scores.formatting}%</span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill fill-formatting" id="bar-formatting"></div>
              </div>
            </div>

            <div class="breakdown-item">
              <div class="breakdown-label-row">
                <span class="breakdown-label">Content & Section Depth</span>
                <span class="breakdown-val">${scores.content_quality}%</span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill fill-content_quality" id="bar-content_quality"></div>
              </div>
            </div>

            <div class="breakdown-item">
              <div class="breakdown-label-row">
                <span class="breakdown-label">Keyword Density</span>
                <span class="breakdown-val">${scores.keyword_relevance}%</span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill fill-keyword_relevance" id="bar-keyword_relevance"></div>
              </div>
            </div>

            <div class="breakdown-item">
              <div class="breakdown-label-row">
                <span class="breakdown-label">Impact Statements & Verbs</span>
                <span class="breakdown-val">${scores.impact_statements}%</span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill fill-impact_statements" id="bar-impact_statements"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Interactive improvement feedback tips -->
      <div class="glass-card" style="display: flex; flex-direction: column;">
        <h2 style="margin-bottom: 8px;">ATS Improvement Checklist</h2>
        <p class="text-secondary" style="font-size: 14px; margin-bottom: 24px;">
          Select a category below to view specific, AI-driven items to improve your score.
        </p>

        <div class="improvement-tabs">
          <button class="improvement-tab-btn active" data-category="formatting">Formatting (${feedback.formatting.length})</button>
          <button class="improvement-tab-btn" data-category="content_quality">Content Depth (${feedback.content_quality.length})</button>
          <button class="improvement-tab-btn" data-category="keyword_relevance">Keywords (${feedback.keyword_relevance.length})</button>
          <button class="improvement-tab-btn" data-category="impact_statements">Impact Verbs (${feedback.impact_statements.length})</button>
        </div>

        <div id="tips-container" class="tips-list" style="flex-grow: 1;">
          <!-- Active Category tips render here -->
        </div>
      </div>

    </div>
  `;

  // Dynamic animations trigger after render
  setTimeout(() => {
    // 1. Ring animation
    const ring = document.getElementById("dashboard-score-ring");
    if (ring) {
      const circumference = 502; // 2 * PI * r (r=80)
      const offset = circumference - (circumference * scores.overall) / 100;
      ring.style.strokeDashoffset = offset;
    }

    // 2. Score text count-up
    const scoreNum = document.getElementById("dashboard-score-num");
    if (scoreNum) {
      let currentVal = 0;
      const targetVal = scores.overall;
      if (targetVal > 0) {
        const increment = Math.ceil(targetVal / 30); // 30 steps
        const countInterval = setInterval(() => {
          currentVal += increment;
          if (currentVal >= targetVal) {
            currentVal = targetVal;
            clearInterval(countInterval);
          }
          scoreNum.textContent = currentVal;
        }, 30);
      } else {
        scoreNum.textContent = 0;
      }
    }

    // 3. Categories progress bars animation
    const categories = ["formatting", "content_quality", "keyword_relevance", "impact_statements"];
    categories.forEach(cat => {
      const bar = document.getElementById(`bar-${cat}`);
      if (bar) {
        bar.style.width = `${scores[cat]}%`;
      }
    });
  }, 100);

  // Tips tabs logic
  const tabs = document.querySelectorAll(".improvement-tab-btn");
  const tipsContainer = document.getElementById("tips-container");

  function renderTips(category) {
    const categoryTips = feedback[category] || [];
    
    if (categoryTips.length === 0) {
      tipsContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); padding: 40px; text-align: center;">
          <i data-lucide="check" style="color: var(--success); width: 32px; height: 32px; margin-bottom: 12px;"></i>
          <p style="font-weight: 500;">No items flagged. Excellent performance!</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    tipsContainer.innerHTML = categoryTips.map(tip => `
      <div class="tip-card tip-${category} animate-fade-in">
        <div class="tip-icon-bullet">
          <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
        </div>
        <p class="tip-text">${tip}</p>
      </div>
    `).join("");
    
    lucide.createIcons();
  }

  // Bind tab buttons
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const category = tab.getAttribute("data-category");
      renderTips(category);
    });
  });

  // Default rendering for first category (formatting)
  renderTips("formatting");
}
