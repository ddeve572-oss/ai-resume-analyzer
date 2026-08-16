const API_BASE = "/api";

// Helper to get headers with JWT token attached
function getHeaders(extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Global API object
export const api = {
  // Authentication
  async register(email, password, fullName) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Registration failed");
    
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Login failed");
    
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("latestAnalysis");
  },

  getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("token");
  },

  // Resume Upload & Analysis
  async uploadResume(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/resume/upload`, {
      method: "POST",
      headers: getHeaders(),
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Resume upload failed");
    return data;
  },

  async analyzeResume(text, filename = "resume.pdf") {
    const userSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
    const customApiKey = userSettings.geminiApiKey || "";

    const headers = getHeaders({ "Content-Type": "application/json" });
    if (customApiKey) {
      headers["X-Gemini-API-Key"] = customApiKey;
    }

    const res = await fetch(`${API_BASE}/resume/analyze`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text, filename })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Resume analysis failed");
    
    // Cache latest analysis
    localStorage.setItem("latestAnalysis", JSON.stringify(data));
    return data;
  },

  async getLatestResume() {
    const res = await fetch(`${API_BASE}/resume/latest`, {
      method: "GET",
      headers: getHeaders()
    });
    if (res.status === 401) {
      this.logout();
      window.location.hash = "#login";
      return null;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to fetch latest resume");
    return data;
  },

  async getResumeHistory() {
    const res = await fetch(`${API_BASE}/resume/history`, {
      method: "GET",
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to fetch resume history");
    return data;
  },

  // Jobs
  async getJobs(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.location) queryParams.append("location", filters.location);
    if (filters.experienceLevel) queryParams.append("experience_level", filters.experienceLevel);
    if (filters.jobType) queryParams.append("job_type", filters.jobType);

    const res = await fetch(`${API_BASE}/jobs?${queryParams.toString()}`, {
      method: "GET",
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to fetch jobs");
    return data;
  },

  async saveJob(jobId) {
    const res = await fetch(`${API_BASE}/jobs/save`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ job_id: jobId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to save job");
    return data;
  },

  async unsaveJob(jobId) {
    const res = await fetch(`${API_BASE}/jobs/unsave`, {
      method: "POST",
      headers: getHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ job_id: jobId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to unsave job");
    return data;
  },

  async getSavedJobs() {
    const res = await fetch(`${API_BASE}/jobs/saved`, {
      method: "GET",
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to fetch saved jobs");
    return data;
  },

  async deleteResume(resumeId) {
    const res = await fetch(`${API_BASE}/resume/${resumeId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to delete resume");
    return data;
  }
};
