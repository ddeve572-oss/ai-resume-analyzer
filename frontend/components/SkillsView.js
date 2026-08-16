import { store } from "../app.js";

export function renderSkills(container) {
  const analysis = store.latestAnalysis;

  if (!analysis) {
    container.innerHTML = `
      <div class="glass-card text-center" style="max-width: 600px; margin: 40px auto; padding: 40px 20px;">
        <i data-lucide="brain" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
        <h2>No Skills Profile Found</h2>
        <p class="text-secondary" style="margin-bottom: 20px;">Please upload and analyze a resume first.</p>
        <a href="#upload" class="btn btn-primary">Go to Upload</a>
      </div>
    `;
    return;
  }

  const skills = analysis.skills || { technical: [], soft: [] };
  const techSkills = skills.technical || [];
  const softSkills = skills.soft || [];

  container.innerHTML = `
    <div class="skills-container animate-fade-in">
      
      <!-- Technical Skills Column -->
      <div class="glass-card skills-list-block">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--card-border); padding-bottom: 15px;">
          <div class="feature-icon" style="color: var(--teal); background: rgba(20, 184, 166, 0.15); width: 38px; height: 38px; border-radius: 8px;">
            <i data-lucide="code-2" style="width: 20px; height: 20px;"></i>
          </div>
          <div>
            <h3 style="font-size: 18px; font-weight: 600;">Technical Skills</h3>
            <p class="text-muted" style="font-size: 12px;">Core technologies, tools, and platforms detected</p>
          </div>
          <span class="badge badge-teal" style="margin-left: auto;">${techSkills.length} found</span>
        </div>

        ${techSkills.length === 0 ? `
          <p class="text-muted" style="font-size: 14px; text-align: center; padding: 30px;">No technical skills extracted.</p>
        ` : `
          <div class="skills-row-chips">
            ${techSkills.map(skill => `
              <div class="skill-chip">
                <span class="skill-chip-indicator tech-indicator"></span>
                <span>${skill}</span>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Soft Skills Column -->
      <div class="glass-card skills-list-block">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--card-border); padding-bottom: 15px;">
          <div class="feature-icon" style="color: var(--secondary); background: rgba(168, 85, 247, 0.15); width: 38px; height: 38px; border-radius: 8px;">
            <i data-lucide="smile" style="width: 20px; height: 20px;"></i>
          </div>
          <div>
            <h3 style="font-size: 18px; font-weight: 600;">Soft Skills & Attributes</h3>
            <p class="text-muted" style="font-size: 12px;">Interpersonal qualities and communication style</p>
          </div>
          <span class="badge badge-secondary" style="margin-left: auto;">${softSkills.length} found</span>
        </div>

        ${softSkills.length === 0 ? `
          <p class="text-muted" style="font-size: 14px; text-align: center; padding: 30px;">No soft skills extracted.</p>
        ` : `
          <div class="skills-row-chips">
            ${softSkills.map(skill => `
              <div class="skill-chip">
                <span class="skill-chip-indicator soft-indicator"></span>
                <span>${skill}</span>
              </div>
            `).join("")}
          </div>
        `}
      </div>

    </div>
  `;
}
