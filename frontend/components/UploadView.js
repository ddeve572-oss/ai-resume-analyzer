import { api } from "../api.js";
import { ui, store } from "../app.js";

export function renderUpload(container) {
  container.innerHTML = `
    <div class="upload-grid animate-fade-in">
      
      <!-- Left side: Dropzone file picker -->
      <div class="glass-card">
        <h2 style="margin-bottom: 8px;">Upload Your Resume</h2>
        <p class="text-secondary" style="margin-bottom: 24px; font-size: 14px;">
          Select a PDF or DOCX file. The system will extract the text content, let you preview it, and then submit it for AI analysis.
        </p>

        <div id="dropzone" class="dropzone-container">
          <div class="dropzone-icon">
            <i data-lucide="cloud-upload" style="width: 32px; height: 32px;"></i>
          </div>
          <div>
            <p style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">Drag and drop your file here</p>
            <p class="text-muted" style="font-size: 12px;">or click to browse from files</p>
          </div>
          <p class="badge badge-secondary">PDF, DOC, DOCX up to 5MB</p>
          <input type="file" id="file-input" class="file-input-hidden" accept=".pdf,.docx,.doc">
        </div>

        <div id="upload-progress-section" class="upload-progress-container" style="display: none;">
          <div class="progress-label-row">
            <span id="uploading-filename-label" class="text-secondary">file.pdf</span>
            <span id="upload-percent-label" style="font-weight: 600; color: var(--teal);">0%</span>
          </div>
          <div class="progress-bar-track">
            <div id="upload-progress-bar-fill" class="progress-bar-fill"></div>
          </div>
        </div>

        <div id="submit-section" style="display: none; margin-top: 24px; text-align: right;">
          <button id="btn-cancel-file" class="btn btn-secondary">Clear File</button>
          <button id="btn-submit-analyze" class="btn btn-primary">
            <span>Analyze Resume</span>
            <i data-lucide="sparkles"></i>
          </button>
        </div>
      </div>

      <!-- Right side: Parsed text preview pane -->
      <div class="glass-card preview-panel">
        <div class="preview-header">
          <h3 style="font-size: 16px; font-weight: 600;">Text Extraction Preview</h3>
          <span id="preview-status" class="badge badge-primary">No file selected</span>
        </div>
        <div id="preview-box" class="preview-content">
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-family: var(--font-body); text-align: center; gap: 8px;">
            <i data-lucide="file-text" style="width: 24px; height: 24px;"></i>
            <p>Upload a file to preview parsed text.</p>
          </div>
        </div>
      </div>
      
    </div>
  `;

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const progressSection = document.getElementById("upload-progress-section");
  const submitSection = document.getElementById("submit-section");
  const previewBox = document.getElementById("preview-box");
  const previewStatus = document.getElementById("preview-status");
  const filenameLabel = document.getElementById("uploading-filename-label");
  const percentLabel = document.getElementById("upload-percent-label");
  const progressBarFill = document.getElementById("upload-progress-bar-fill");
  const btnCancel = document.getElementById("btn-cancel-file");
  const btnSubmit = document.getElementById("btn-submit-analyze");

  let parsedText = "";
  let activeFilename = "";

  // Trigger file browser
  dropzone.addEventListener("click", () => fileInput.click());

  // Drag and Drop styling events
  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add("drag-active");
    }, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove("drag-active");
    }, false);
  });

  // Handle dropped files
  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  // Handle selected files via input browser
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // Cancel selection
  btnCancel.addEventListener("click", () => {
    resetUploadState();
  });

  // Submit parsed text for Gemini AI analysis
  btnSubmit.addEventListener("click", async () => {
    if (!parsedText) {
      ui.showToast("No resume text to analyze.", "error");
      return;
    }

    ui.showLoading("Analyzing with Gemini AI...", "Scanning keywords, formatting, and impact phrases");
    try {
      const analysisData = await api.analyzeResume(parsedText, activeFilename);
      store.latestAnalysis = analysisData;
      ui.hideLoading();
      ui.showToast("Analysis complete!", "success");
      window.location.hash = "#dashboard";
    } catch (err) {
      ui.hideLoading();
      ui.showToast(`Analysis failed: ${err.message}`, "error");
    }
  });

  function resetUploadState() {
    parsedText = "";
    activeFilename = "";
    fileInput.value = "";
    progressSection.style.display = "none";
    submitSection.style.display = "none";
    dropzone.style.display = "flex";
    previewStatus.className = "badge badge-primary";
    previewStatus.textContent = "No file selected";
    previewBox.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); font-family: var(--font-body); text-align: center; gap: 8px;">
        <i data-lucide="file-text" style="width: 24px; height: 24px;"></i>
        <p>Upload a file to preview parsed text.</p>
      </div>
    `;
    lucide.createIcons();
  }

  // Handle validation and text extraction
  async function handleFileSelection(file) {
    // 1. File type validation
    const allowedExtensions = ["pdf", "docx", "doc"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      ui.showToast("Unsupported file type. Please upload a PDF or Word (.docx/.doc) document.", "error");
      return;
    }

    // 2. File size validation (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      ui.showToast("File size exceeds 5MB. Please upload a smaller file.", "error");
      return;
    }

    // Set filename and UI state
    activeFilename = file.name;
    filenameLabel.textContent = file.name;
    dropzone.style.display = "none";
    progressSection.style.display = "flex";
    
    // Simulate loading progress bar to user
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      percentLabel.textContent = `${progress}%`;
      progressBarFill.style.width = `${progress}%`;
    }, 100);

    // Call backend API to parse text
    try {
      previewStatus.className = "badge badge-warning";
      previewStatus.textContent = "Parsing Text...";
      previewBox.innerHTML = `
        <div class="skeleton-loader skeleton-text skeleton-text-lg"></div>
        <div class="skeleton-loader skeleton-text skeleton-text-md"></div>
        <div class="skeleton-loader skeleton-text skeleton-text-sm"></div>
        <div class="skeleton-loader skeleton-text skeleton-text-md"></div>
      `;

      const response = await api.uploadResume(file);
      
      // Ensure visual loader catches up
      clearInterval(interval);
      percentLabel.textContent = "100%";
      progressBarFill.style.width = "100%";

      // Cache parsed text
      parsedText = response.text;
      
      // Render text preview
      previewStatus.className = "badge badge-success";
      previewStatus.textContent = "Parsed Successfully";
      previewBox.textContent = parsedText;
      
      // Show submission section
      submitSection.style.display = "block";
      lucide.createIcons();
    } catch (err) {
      clearInterval(interval);
      ui.showToast(`Parsing failed: ${err.message}`, "error");
      resetUploadState();
    }
  }
}
