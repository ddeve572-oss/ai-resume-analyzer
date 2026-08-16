import { api } from "../api.js";
import { store } from "../app.js";

export async function renderSkillGap(container) {
  const analysis = store.latestAnalysis;

  if (!analysis) {
    container.innerHTML = `
      <div class="glass-card text-center" style="max-width: 600px; margin: 40px auto; padding: 40px 20px;">
        <i data-lucide="git-pull-request" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
        <h2>Upload Resume to View Skill Gaps</h2>
        <p class="text-secondary" style="margin-bottom: 20px;">We compare your resume skills against target job descriptions to map missing requirements.</p>
        <a href="#upload" class="btn btn-primary">Go to Upload</a>
      </div>
    `;
    return;
  }

  // Retrieve user skills (technical + soft, all lowercase for matching)
  const userTech = (analysis.skills?.technical || []).map(s => s.toLowerCase());
  const userSoft = (analysis.skills?.soft || []).map(s => s.toLowerCase());
  const userSkillsAll = new Set([...userTech, ...userSoft]);

  // Fetch jobs list if not loaded yet
  if (store.jobs.length === 0) {
    try {
      store.jobs = await api.getJobs();
    } catch (e) {
      console.error("Could not fetch jobs list:", e);
    }
  }

  // Get active job ID from query parameters
  const hash = window.location.hash.slice(1);
  const urlParams = new URLSearchParams(hash.split("?")[1] || "");
  let activeJobId = parseInt(urlParams.get("job")) || (store.jobs[0]?.id || 1);

  // Setup view base structure
  container.innerHTML = `
    <div class="gap-layout animate-fade-in">
      
      <!-- Left: Selector and Radar Web Chart -->
      <div class="glass-card gap-controls-panel">
        <div>
          <label class="form-label" for="select-target-job">Select Target Role</label>
          <select id="select-target-job" class="filter-select" style="width: 100%; margin-top: 6px;">
            ${store.jobs.map(job => `
              <option value="${job.id}" ${job.id === activeJobId ? "selected" : ""}>
                ${job.title} — ${job.company}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="radar-chart-container">
          <div id="radar-viewport" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
            <!-- Custom SVG Radar Chart will draw here -->
          </div>
        </div>
      </div>

      <!-- Right: Detailed Skill Gap List & Learning hooks -->
      <div class="glass-card">
        <div style="border-bottom: 1px solid var(--card-border); padding-bottom: 15px; margin-bottom: 24px;">
          <h3 style="font-size: 18px; font-weight: 600;">Skill Comparison Breakdown</h3>
          <p class="text-muted" style="font-size: 12px; margin-top: 4px;">Comparing your extracted resume skills against target job requirements</p>
        </div>

        <div id="gap-list-viewport" class="gap-details-list">
          <!-- Comparative list items will render here -->
        </div>
      </div>

    </div>
  `;

  const jobSelect = document.getElementById("select-target-job");
  const radarViewport = document.getElementById("radar-viewport");
  const listViewport = document.getElementById("gap-list-viewport");

  // Re-render comparative charts when selected job changes
  jobSelect.addEventListener("change", (e) => {
    activeJobId = parseInt(e.target.value);
    // Update hash query parameter silently without triggering router refresh
    const cleanHash = window.location.hash.split("?")[0];
    history.replaceState(null, "", `${cleanHash}?job=${activeJobId}`);
    updateGapAnalysis();
  });

  function updateGapAnalysis() {
    const job = store.jobs.find(j => j.id === activeJobId);
    if (!job) {
      listViewport.innerHTML = `<p class="text-muted">Target job details not found.</p>`;
      return;
    }

    // Process job skills
    const requiredSkills = job.skills || [];
    
    // Map skills to whether user possesses them
    const comparison = requiredSkills.map(skill => {
      const isMatching = userSkillsAll.has(skill.toLowerCase()) || 
                         [...userSkillsAll].some(us => us.includes(skill.toLowerCase()) || skill.toLowerCase().includes(us));
      return {
        name: skill,
        matching: isMatching,
        userVal: isMatching ? 100 : 15, // 15% as minor base visual representation
        jobVal: 100 // Job requirement baseline
      };
    });

    // 1. Render comparative list
    listViewport.innerHTML = comparison.map(item => `
      <div class="gap-detail-row animate-fade-in">
        <span class="gap-skill-name">${item.name}</span>
        
        <div class="gap-bar-compare">
          <div class="gap-bar-job" style="width: ${item.jobVal}%"></div>
          <div class="gap-bar-user" style="width: ${item.userVal}%"></div>
        </div>

        <span class="gap-status-label ${item.matching ? "gap-status-matching" : "gap-status-missing"}">
          ${item.matching ? "Matching" : "Missing"}
        </span>
      </div>
    `).join("");

    // Add CTA to learning path if gaps exist
    const hasGaps = comparison.some(i => !i.matching);
    if (hasGaps) {
      const missingSkillsQuery = comparison
        .filter(i => !i.matching)
        .map(i => i.name)
        .join(",");
        
      listViewport.innerHTML += `
        <div style="margin-top: 24px; text-align: right; border-top: 1px solid var(--card-border); padding-top: 20px;">
          <a href="#learning?skills=${encodeURIComponent(missingSkillsQuery)}" class="btn btn-teal">
            <i data-lucide="graduation-cap"></i>
            <span>Close Skill Gaps</span>
          </a>
        </div>
      `;
    } else {
      listViewport.innerHTML += `
        <div style="margin-top: 24px; text-align: center; border-top: 1px solid var(--card-border); padding-top: 20px; color: var(--success);">
          <i data-lucide="award" style="width: 24px; height: 24px; margin-bottom: 6px;"></i>
          <p style="font-weight: 600; font-size: 14px;">Perfect Fit! You have all the key skills required for this job.</p>
        </div>
      `;
    }

    // 2. Render Custom SVG Radar Web Chart
    renderRadarChart(comparison);
  }

  function renderRadarChart(comparison) {
    // Limits the radar to max 7 variables to maintain visual clean geometry
    const skillsToDraw = comparison.slice(0, 6);
    const N = skillsToDraw.length;
    if (N < 3) {
      radarViewport.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-muted);">
          <i data-lucide="info" style="margin-bottom: 8px;"></i>
          <p>Not enough skills variables to render radar map. Renders comparison list on the right instead.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    const size = 380;
    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = 130;

    // Outer grid rings
    const ringLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    let gridLinesHtml = "";
    
    // Draw concentric polygons for background grid web
    ringLevels.forEach(level => {
      const radius = maxRadius * level;
      const points = [];
      for (let i = 0; i < N; i++) {
        const angle = (i * 2 * Math.PI) / N;
        const x = centerX + radius * Math.sin(angle);
        const y = centerY - radius * Math.cos(angle);
        points.push(`${x},${y}`);
      }
      gridLinesHtml += `<polygon points="${points.join(" ")}" class="radar-web-line"></polygon>`;
    });

    // Draw axis lines from center to outer vertices + text labels
    let axisLinesHtml = "";
    let labelsHtml = "";
    
    skillsToDraw.forEach((skill, i) => {
      const angle = (i * 2 * Math.PI) / N;
      // Outer vertex
      const xOuter = centerX + maxRadius * Math.sin(angle);
      const yOuter = centerY - maxRadius * Math.cos(angle);
      axisLinesHtml += `<line x1="${centerX}" y1="${centerY}" x2="${xOuter}" y2="${yOuter}" class="radar-axis-line"></line>`;

      // Label coordinate (offset slightly from outer vertex)
      const labelDistance = maxRadius + 22;
      const xLabel = centerX + labelDistance * Math.sin(angle);
      const yLabel = centerY - labelDistance * Math.cos(angle);
      
      // Fine-tune text vertical alignments based on angle position
      let dy = "0.35em";
      let textAnchor = "middle";
      if (Math.sin(angle) > 0.1) textAnchor = "start";
      else if (Math.sin(angle) < -0.1) textAnchor = "end";
      
      if (Math.cos(angle) > 0.8) dy = "-0.2em"; // top label
      else if (Math.cos(angle) < -0.8) dy = "1em"; // bottom label

      labelsHtml += `
        <text x="${xLabel}" y="${yLabel}" dy="${dy}" text-anchor="${textAnchor}" class="radar-axis-label">
          ${skill.name.length > 15 ? skill.name.slice(0, 13) + "..." : skill.name}
        </text>
      `;
    });

    // Draw job requirement polygon (always 100% outer boundary)
    const jobPoints = [];
    skillsToDraw.forEach((skill, i) => {
      const angle = (i * 2 * Math.PI) / N;
      const x = centerX + maxRadius * Math.sin(angle);
      const y = centerY - maxRadius * Math.cos(angle);
      jobPoints.push(`${x},${y}`);
    });

    // Draw user matched polygon (dynamically scales to matched value)
    const userPoints = [];
    skillsToDraw.forEach((skill, i) => {
      const angle = (i * 2 * Math.PI) / N;
      const userRadius = maxRadius * (skill.userVal / 100);
      const x = centerX + userRadius * Math.sin(angle);
      const y = centerY - userRadius * Math.cos(angle);
      userPoints.push(`${x},${y}`);
    });

    // Markers points HTML (circles on vertices)
    let markersHtml = "";
    skillsToDraw.forEach((skill, i) => {
      const angle = (i * 2 * Math.PI) / N;
      // User marker
      const userRadius = maxRadius * (skill.userVal / 100);
      const ux = centerX + userRadius * Math.sin(angle);
      const uy = centerY - userRadius * Math.cos(angle);
      markersHtml += `<circle cx="${ux}" cy="${uy}" r="4.5" class="radar-marker-user" title="You: ${skill.matching ? 'Have' : 'Need'} ${skill.name}"></circle>`;

      // Job requirement marker
      const jx = centerX + maxRadius * Math.sin(angle);
      const jy = centerY - maxRadius * Math.cos(angle);
      markersHtml += `<circle cx="${jx}" cy="${jy}" r="3" class="radar-marker-job"></circle>`;
    });

    radarViewport.innerHTML = `
      <svg class="radar-svg" viewBox="0 0 ${size} ${size}">
        <!-- Grid Web concentric rings -->
        ${gridLinesHtml}
        
        <!-- Axis spikes -->
        ${axisLinesHtml}
        
        <!-- Job Requirement Polys -->
        <polygon points="${jobPoints.join(" ")}" class="radar-poly-job"></polygon>
        
        <!-- User Experience Poly -->
        <polygon points="${userPoints.join(" ")}" class="radar-poly-user"></polygon>
        
        <!-- Interactive markers -->
        ${markersHtml}
        
        <!-- Axis Text Labels -->
        ${labelsHtml}
      </svg>
      
      <!-- Legends -->
      <div class="radar-legend">
        <div class="legend-item">
          <div class="legend-color-box" style="background: var(--teal);"></div>
          <span>Your Resume</span>
        </div>
        <div class="legend-item">
          <div class="legend-color-box" style="background: var(--secondary); opacity: 0.7; border: 1.5px dashed var(--secondary);"></div>
          <span>Job Requirements</span>
        </div>
      </div>
    `;

    lucide.createIcons();
  }

  // Initial render
  updateGapAnalysis();
}
