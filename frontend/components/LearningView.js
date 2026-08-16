import { store } from "../app.js";

// Course Catalog database mapping skills to course metadata
const COURSE_CATALOG = [
  {
    skill: "docker",
    title: "Docker Technologies for DevOps and Developers",
    platform: "Udemy",
    duration: "8 hours",
    url: "https://www.udemy.com/course/docker-technologies/",
    description: "Master Docker containerization, registries, networks, docker-compose, and swarm configurations from scratch."
  },
  {
    skill: "aws",
    title: "AWS Certified Solutions Architect Associate",
    platform: "Coursera",
    duration: "4 weeks (8h/wk)",
    url: "https://www.coursera.org/specializations/aws-fundamentals",
    description: "Design secure, cost-optimized, resilient system architectures on AWS. Prepares for official associate cert."
  },
  {
    skill: "python",
    title: "Python for Everybody Specialization",
    platform: "Coursera",
    duration: "2 weeks (10h/wk)",
    url: "https://www.coursera.org/specializations/python",
    description: "Learn core syntax, data structures, fetching web details, database queries, and data science concepts in Python."
  },
  {
    skill: "react",
    title: "Modern React with Redux & Hooks",
    platform: "Udemy",
    duration: "20 hours",
    url: "https://www.udemy.com/course/react-redux/",
    description: "Master React, React Router, Redux Toolkit, hooks, transitions, custom components, and deployment pipelines."
  },
  {
    skill: "kubernetes",
    title: "Certified Kubernetes Administrator (CKA)",
    platform: "Udemy",
    duration: "16 hours",
    url: "https://www.udemy.com/course/certified-kubernetes-administrator/",
    description: "Deploy, configure, monitor, scale, and troubleshoot containerized workloads in production Kubernetes clusters."
  },
  {
    skill: "typescript",
    title: "Understanding TypeScript — 2026 Edition",
    platform: "Udemy",
    duration: "15 hours",
    url: "https://www.udemy.com/course/understanding-typescript/",
    description: "Complete guide on typing, interfaces, generics, decorator patterns, namespaces, and compilation configs."
  },
  {
    skill: "sql",
    title: "SQL for Data Science Masterclass",
    platform: "Coursera",
    duration: "10 hours",
    url: "https://www.coursera.org/learn/sql-for-data-science",
    description: "Learn querying, filters, joins, aggregations, database schemas, and query optimization."
  },
  {
    skill: "git",
    title: "Git and GitHub complete Version Control",
    platform: "freeCodeCamp",
    duration: "2 hours",
    url: "https://www.freecodecamp.org/news/git-and-github-crash-course/",
    description: "Comprehensive crash course on version control, branching, committing, pull requests, merge conflict resolutions."
  },
  {
    skill: "figma",
    title: "Figma UI/UX Design Essentials",
    platform: "Udemy",
    duration: "12 hours",
    url: "https://www.udemy.com/course/figma-uiux-design-essentials/",
    description: "Design mobile apps, websites, high-fidelity wireframes, interactive prototyping, and system styles."
  },
  {
    skill: "tableau",
    title: "Data Visualization with Tableau",
    platform: "Coursera",
    duration: "3 weeks (6h/wk)",
    url: "https://www.coursera.org/specializations/data-visualization-tableau",
    description: "Build clean, interactive dashboards, worksheets, charts, maps, storyboards, and KPIs."
  },
  {
    skill: "cypress",
    title: "Automated Web Testing with Cypress",
    platform: "freeCodeCamp",
    duration: "4 hours",
    url: "https://www.freecodecamp.org/news/cypress-testing-tutorial/",
    description: "Write end-to-end testing, integration tests, mock endpoints, and test responsive UI layouts."
  },
  {
    skill: "playwright",
    title: "Web Automation & Testing with Playwright",
    platform: "Udemy",
    duration: "8 hours",
    url: "https://www.udemy.com/course/playwright-tutorials/",
    description: "Learn to automate web browsers using Playwright. Covers code generator, trace viewer, and parallel runs."
  },
  {
    skill: "machine learning",
    title: "Machine Learning Specialization by Andrew Ng",
    platform: "Coursera",
    duration: "4 weeks (9h/wk)",
    url: "https://www.coursera.org/specializations/machine-learning-introduction",
    description: "Supervised and unsupervised learning, regression, classification, neural networks, advice for applying ML."
  },
  {
    skill: "nlp",
    title: "Natural Language Processing Specialization",
    platform: "Coursera",
    duration: "3 weeks (7h/wk)",
    url: "https://www.coursera.org/specializations/natural-language-processing-tensorflow",
    description: "Master text classification, sequence models, transformers, attention models, and sentiment analysis."
  },
  {
    skill: "llm",
    title: "Generative AI with Large Language Models",
    platform: "Coursera",
    duration: "2 weeks",
    url: "https://www.coursera.org/learn/generative-ai-with-llms",
    description: "Understand the lifecycle of generative AI projects, pretraining, fine-tuning, RAG, RLHF, and agent frameworks."
  },
  {
    skill: "terraform",
    title: "HashiCorp Certified: Terraform Associate",
    platform: "Udemy",
    duration: "10 hours",
    url: "https://www.udemy.com/course/terraform-associate-guide/",
    description: "Master Infrastructure as Code (IaC). Covers providers, state files, variables, modules, and Terraform Cloud."
  },
  {
    skill: "ci/cd",
    title: "GitHub Actions CI/CD Pipelines Mastery",
    platform: "freeCodeCamp",
    duration: "3 hours",
    url: "https://www.freecodecamp.org/news/github-actions-cicd-tutorial/",
    description: "Learn compilation pipelines, container packaging, automatic test triggers, and AWS staging deployments."
  },
  {
    skill: "communication",
    title: "Improving Communication Skills",
    platform: "Coursera",
    duration: "8 hours",
    url: "https://www.coursera.org/learn/communication-skills",
    description: "Learn strategic messaging, active listening, trust building, negotiation, and cross-cultural discussion."
  },
  {
    skill: "leadership",
    title: "Strategic Leadership and Management",
    platform: "Coursera",
    duration: "2 weeks (8h/wk)",
    url: "https://www.coursera.org/specializations/strategic-leadership",
    description: "Develop corporate management plans, organizational design, feedback guidelines, and group negotiation."
  },
  {
    skill: "scrum",
    title: "Scrum Master Certification Training",
    platform: "Udemy",
    duration: "6 hours",
    url: "https://www.udemy.com/course/scrum-master-training/",
    description: "Master Scrum values, team structures, sprint planning, retrospective guidelines, and backlog refinements."
  },
  {
    skill: "agile",
    title: "Agile Software Development Specialization",
    platform: "Coursera",
    duration: "2 weeks (8h/wk)",
    url: "https://www.coursera.org/specializations/agile-development",
    description: "Covers Scrum, XP, Kanban practices, writing user stories, agile estimation, and backlog grooming."
  }
];

export function renderLearning(container) {
  const analysis = store.latestAnalysis;

  // Retrieve missing skills (either from query parameters or calculated from latest analysis)
  const hash = window.location.hash.slice(1);
  const urlParams = new URLSearchParams(hash.split("?")[1] || "");
  const skillsQuery = urlParams.get("skills");

  let missingSkills = [];

  if (skillsQuery) {
    // Skills passed in via url gap query link
    missingSkills = skillsQuery.split(",").map(s => s.trim().toLowerCase());
  } else if (analysis) {
    // Derive missing skills by looking at matching jobs
    // To make it simple: let's scan all jobs, compile a set of skills required,
    // and extract the ones the user DOES NOT have.
    const userTech = (analysis.skills?.technical || []).map(s => s.toLowerCase());
    const userSoft = (analysis.skills?.soft || []).map(s => s.toLowerCase());
    const userSkillsAll = new Set([...userTech, ...userSoft]);

    const allJobSkills = new Set();
    store.jobs.forEach(job => {
      (job.skills || []).forEach(s => allJobSkills.add(s.toLowerCase()));
    });

    // Filter skills the user is missing
    missingSkills = [...allJobSkills].filter(skill => {
      return !userSkillsAll.has(skill) && 
             ![...userSkillsAll].some(us => us.includes(skill) || skill.includes(us));
    });
    
    // Sort or cap to top 6 skills based on job frequency to keep UI clean
    missingSkills = missingSkills.slice(0, 6);
  }

  // Handle case where they have zero gaps or no analysis loaded
  if (missingSkills.length === 0) {
    container.innerHTML = `
      <div class="glass-card text-center" style="max-width: 600px; margin: 40px auto; padding: 40px 20px;">
        <i data-lucide="award" style="width: 48px; height: 48px; color: var(--success); margin-bottom: 16px;"></i>
        <h2>No Skill Gaps Detected</h2>
        <p class="text-secondary" style="margin-bottom: 20px;">
          ${analysis 
            ? "Congratulations! Your skills profile matches perfectly with all target positions. Keep monitoring your settings." 
            : "Please upload and analyze your resume first to identify skill gaps."}
        </p>
        <a href="${analysis ? '#jobs' : '#upload'}" class="btn btn-primary">
          ${analysis ? 'Browse Jobs' : 'Upload Resume'}
        </a>
      </div>
    `;
    return;
  }

  // Match missing skills against course catalog
  const matchedCourses = [];
  missingSkills.forEach(missingSkill => {
    // Look up exact or substring match in catalog
    const course = COURSE_CATALOG.find(c => {
      return c.skill === missingSkill || 
             missingSkill.includes(c.skill) || 
             c.skill.includes(missingSkill);
    });

    if (course) {
      // Calculate Job Impact Score: count how many of our seeded jobs require this skill
      let jobCount = 0;
      store.jobs.forEach(job => {
        const skillsList = (job.skills || []).map(s => s.toLowerCase());
        if (skillsList.some(s => s === missingSkill || s.includes(missingSkill) || missingSkill.includes(s))) {
          jobCount++;
        }
      });

      // Default to 1 if no jobs matched to show a baseline
      const impactRating = Math.max(1, jobCount);
      
      matchedCourses.push({
        ...course,
        targetSkillName: missingSkill,
        jobDemandCount: impactRating
      });
    }
  });

  // Sort matched courses by job impact (descending)
  matchedCourses.sort((a, b) => b.jobDemandCount - a.jobDemandCount);

  // Render Layout
  container.innerHTML = `
    <div class="learning-layout animate-fade-in">
      <div class="learning-intro">
        <h2>Your Personalized Skill Roadmaps</h2>
        <p class="text-secondary" style="margin-top: 8px; font-size: 14px; line-height: 1.6;">
          Based on the target job requirements we've detected, these courses are recommended to help you close your skill gaps. 
          Prioritized by impact, representing how frequently the skill appears in matches.
        </p>
      </div>

      <div class="learning-path-grid">
        ${matchedCourses.map(course => {
          let platformColor = "badge-primary";
          if (course.platform.toLowerCase() === "udemy") platformColor = "badge-secondary";
          if (course.platform.toLowerCase() === "freecodecamp") platformColor = "badge-teal";

          return `
            <div class="glass-card course-card animate-fade-in">
              <div class="course-platform-badge">
                <span class="platform-label">${course.platform}</span>
                <span class="badge badge-success">Impact: ${course.jobDemandCount} ${course.jobDemandCount === 1 ? 'role' : 'roles'}</span>
              </div>

              <div>
                <h3 class="course-card-title">${course.title}</h3>
                <span class="course-target-skill">Target Skill: <strong>${course.targetSkillName.toUpperCase()}</strong></span>
              </div>

              <p class="course-desc">${course.description}</p>

              <div class="course-card-footer">
                <span class="course-duration">
                  <i data-lucide="clock" style="width: 13px; height: 13px; margin-right: 4px; vertical-align: middle;"></i>
                  ${course.duration}
                </span>
                
                <a href="${course.url}" target="_blank" class="btn btn-teal btn-sm">
                  <span>Start Course</span>
                  <i data-lucide="external-link" style="width: 13px; height: 13px;"></i>
                </a>
              </div>
            </div>
          `;
        }).join("")}

        <!-- Case where missing skills didn't match any catalog items -->
        ${matchedCourses.length === 0 ? `
          <div class="glass-card text-center" style="grid-column: 1 / -1; padding: 40px;">
            <p class="text-secondary">No course recommendations available in the catalog for your current gaps: <strong>${missingSkills.join(", ").toUpperCase()}</strong>.</p>
            <p class="text-muted" style="font-size: 12.5px; margin-top: 8px;">Try searching these topics directly on platforms like Coursera, edX, or Udemy.</p>
          </div>
        ` : ""}
      </div>
    </div>
  `;

  lucide.createIcons();
}
