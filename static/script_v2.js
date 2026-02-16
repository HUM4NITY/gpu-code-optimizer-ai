// GPU Code Optimizer v2 - Modern implementation
// Features: History, Compare, Export, Search, Filters

const API_BASE = '';
let analysisHistory = [];
let currentAnalysis = null;

// DOM Elements
const els = {
    codeInput: document.getElementById('codeInput'),
    languageSelect: document.getElementById('languageSelect'),
    modelSelect: document.getElementById('modelSelect'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    clearBtn: document.getElementById('clearBtn'),
    pasteBtn: document.getElementById('pasteBtn'),
    examplesBtn: document.getElementById('examplesBtn'),
    compareBtn: document.getElementById('compareBtn'),
    exportBtn: document.getElementById('exportBtn'),
    historyBtn: document.getElementById('historyBtn'),
    resultsContainer: document.getElementById('resultsContainer'),
    statusPill: document.getElementById('statusPill'),
    searchResults: document.getElementById('searchResults'),
    examplesModal: document.getElementById('examplesModal'),
    lineNumbers: document.getElementById('lineNumbers'),
    lineCount: document.getElementById('lineCount'),
    charCount: document.getElementById('charCount'),
    totalAnalyses: document.getElementById('totalAnalyses'),
    avgScore: document.getElementById('avgScore')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadModels();
    loadExamples();
    setupEventListeners();
    loadHistory();
    updateStats();
});

function setupEventListeners() {
    els.analyzeBtn.addEventListener('click', analyzeCode);
    els.clearBtn.addEventListener('click', clearCode);
    els.pasteBtn.addEventListener('click', pasteFromClipboard);
    els.examplesBtn.addEventListener('click', showExamplesModal);
    els.compareBtn.addEventListener('click', toggleCompareMode);
    els.exportBtn.addEventListener('click', exportResults);
    els.historyBtn.addEventListener('click', showHistory);
    els.searchResults.addEventListener('input', filterResults);
    
    // Code editor updates
    els.codeInput.addEventListener('input', () => {
        updateLineNumbers();
        updateCodeStats();
    });
    els.codeInput.addEventListener('scroll', syncLineNumbers);
    
    // Modal handlers
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    modalClose.addEventListener('click', hideExamplesModal);
    modalOverlay.addEventListener('click', hideExamplesModal);
    
    // Severity filters
    document.querySelectorAll('[data-severity]').forEach(checkbox => {
        checkbox.addEventListener('change', filterResults);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') analyzeCode();
        if (e.ctrlKey && e.key === 'k') els.searchResults.focus();
        if (e.key === 'Escape') hideExamplesModal();
    });
}

// Load models from Ollama
async function loadModels() {
    try {
        const response = await fetch(`${API_BASE}/api/models`);
        const data = await response.json();
        
        els.modelSelect.innerHTML = '';
        
        if (data.models && data.models.length > 0) {
            const nemotronModels = data.models.filter(m => m.toLowerCase().includes('nemotron'));
            const otherModels = data.models.filter(m => !m.toLowerCase().includes('nemotron'));
            
            if (nemotronModels.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = 'NVIDIA Nemotron';
                nemotronModels.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    optgroup.appendChild(option);
                });
                els.modelSelect.appendChild(optgroup);
            }
            
            if (otherModels.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = 'Other Models';
                otherModels.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    optgroup.appendChild(option);
                });
                els.modelSelect.appendChild(optgroup);
            }
        } else {
            els.modelSelect.innerHTML = '<option value="nemotron-mini">nemotron-mini</option>';
        }
    } catch (error) {
        console.error('Failed to load models:', error);
        els.modelSelect.innerHTML = '<option value="nemotron-mini">nemotron-mini</option>';
    }
}

// Load examples
async function loadExamples() {
    try {
        const response = await fetch(`${API_BASE}/api/examples`);
        const examples = await response.json();
        
        const examplesList = document.getElementById('examplesList');
        examplesList.innerHTML = '';
        
        Object.entries(examples).forEach(([key, example]) => {
            const card = document.createElement('div');
            card.className = 'example-item';
            card.innerHTML = `
                <div class="example-header">
                    <h3>${example.name}</h3>
                    <span class="language-badge">${example.language.toUpperCase()}</span>
                </div>
                <pre class="example-code">${escapeHtml(example.code.substring(0, 200))}...</pre>
            `;
            card.addEventListener('click', () => loadExample(example));
            examplesList.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load examples:', error);
    }
}

function loadExample(example) {
    els.codeInput.value = example.code;
    els.languageSelect.value = example.language;
    hideExamplesModal();
    updateLineNumbers();
    updateCodeStats();
    els.codeInput.focus();
}

// Analyze code
async function analyzeCode() {
    const code = els.codeInput.value.trim();
    
    if (!code) {
        showNotification('Please enter some code to analyze', 'warning');
        return;
    }
    
    setAnalyzingState(true);
    
    try {
        const response = await fetch(`${API_BASE}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: code,
                language: els.languageSelect.value,
                model: els.modelSelect.value
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Analysis failed');
        }
        
        const results = await response.json();
        currentAnalysis = {
            ...results,
            code: code,
            language: els.languageSelect.value,
            timestamp: new Date().toISOString()
        };
        
        displayResults(results);
        saveToHistory(currentAnalysis);
        updateStats();
        
    } catch (error) {
        console.error('Analysis error:', error);
        displayError(error.message);
    } finally {
        setAnalyzingState(false);
    }
}

function setAnalyzingState(analyzing) {
    els.analyzeBtn.disabled = analyzing;
    const statusText = els.statusPill.querySelector('.status-text');
    
    if (analyzing) {
        els.statusPill.classList.add('analyzing');
        statusText.textContent = 'Analyzing...';
        els.analyzeBtn.querySelector('.btn-text').textContent = 'Analyzing...';
        showLoadingState();
    } else {
        els.statusPill.classList.remove('analyzing');
        statusText.textContent = 'Ready';
        els.analyzeBtn.querySelector('.btn-text').textContent = 'Analyze Code';
    }
}

function showLoadingState() {
    els.resultsContainer.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Analyzing your GPU code...</p>
        </div>
    `;
}

// Display results
function displayResults(results) {
    els.resultsContainer.innerHTML = '';
    
    // Summary Card
    const summaryCard = document.createElement('div');
    summaryCard.className = 'summary-card';
    summaryCard.innerHTML = `
        <div class="summary-header">
            <h3>Analysis Summary</h3>
            <div class="score-badge score-${getScoreClass(results.overall_score)}">
                <span class="score-value">${results.overall_score}</span>
                <span class="score-label">/100</span>
            </div>
        </div>
        <p class="summary-text">${escapeHtml(results.summary)}</p>
        <div class="summary-stats">
            <div class="stat">
                <span class="stat-label">Issues Found</span>
                <span class="stat-value">${results.optimizations.length}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Model</span>
                <span class="stat-value">${escapeHtml(results.model_used)}</span>
            </div>
        </div>
    `;
    els.resultsContainer.appendChild(summaryCard);
    
    // Optimization Cards
    if (results.optimizations.length === 0) {
        const noIssues = document.createElement('div');
        noIssues.className = 'no-issues-card';
        noIssues.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="30" cy="30" r="20"/>
                <path d="M20 30l8 8 12-16"/>
            </svg>
            <h3>Great Job!</h3>
            <p>No major optimization issues found in your code.</p>
        `;
        els.resultsContainer.appendChild(noIssues);
    } else {
        results.optimizations.forEach((opt, index) => {
            const card = createOptimizationCard(opt, index);
            els.resultsContainer.appendChild(card);
        });
    }
}

function createOptimizationCard(optimization, index) {
    const card = document.createElement('div');
    card.className = `optimization-card severity-${optimization.severity}`;
    card.dataset.severity = optimization.severity;
    card.dataset.category = optimization.category;
    
    card.innerHTML = `
        <div class="opt-header">
            <div class="opt-number">${index + 1}</div>
            <div class="opt-badges">
                <span class="severity-badge severity-${optimization.severity}">${optimization.severity}</span>
                <span class="category-badge">${formatCategory(optimization.category)}</span>
            </div>
        </div>
        <h4 class="opt-issue">${escapeHtml(optimization.issue)}</h4>
        <p class="opt-suggestion">${escapeHtml(optimization.suggestion)}</p>
        ${optimization.code_snippet ? `
            <div class="code-snippet-wrapper">
                <div class="snippet-header">
                    <span>Optimized Code</span>
                    <button class="copy-btn" onclick="copyToClipboard(this, \`${escapeHtml(optimization.code_snippet).replace(/`/g, '\\`')}\`)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy
                    </button>
                </div>
                <pre><code>${escapeHtml(optimization.code_snippet)}</code></pre>
            </div>
        ` : ''}
        ${optimization.estimated_speedup ? `
            <div class="speedup-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Estimated Speedup: ${escapeHtml(optimization.estimated_speedup)}
            </div>
        ` : ''}
    `;
    
    return card;
}

// Helper functions
function getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
}

function formatCategory(cat) {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy to clipboard
window.copyToClipboard = async function(button, text) {
    try {
        await navigator.clipboard.writeText(text);
        button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Copied!';
        setTimeout(() => {
            button.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

// Paste from clipboard
async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        els.codeInput.value = text;
        updateLineNumbers();
        updateCodeStats();
        showNotification('Code pasted from clipboard', 'success');
    } catch (err) {
        console.error('Failed to paste:', err);
        showNotification('Failed to paste from clipboard', 'error');
    }
}

// Clear code
function clearCode() {
    els.codeInput.value = '';
    updateLineNumbers();
    updateCodeStats();
    els.resultsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-illustration">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="30" width="80" height="60" rx="4" stroke="currentColor" stroke-width="2" opacity="0.2"/>
                    <path d="M30 45h60M30 55h40M30 65h50" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                    <circle cx="85" cy="35" r="15" fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M95 45l8 8" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
            <h3 class="empty-title">Ready to Analyze</h3>
            <p class="empty-description">Paste your GPU code and click "Analyze Code" to get optimization suggestions</p>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">M</div>
                    <span>Memory Optimization</span>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">K</div>
                    <span>Kernel Analysis</span>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">T</div>
                    <span>Tensor Core Usage</span>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">P</div>
                    <span>Parallel Efficiency</span>
                </div>
            </div>
        </div>
    `;
}

// Line numbers
function updateLineNumbers() {
    const lines = els.codeInput.value.split('\n').length;
    els.lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('\n');
}

function syncLineNumbers() {
    els.lineNumbers.scrollTop = els.codeInput.scrollTop;
}

// Code stats
function updateCodeStats() {
    const code = els.codeInput.value;
    const lines = code.split('\n').length;
    const chars = code.length;
    els.lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
    els.charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
}

// Search and filter
function filterResults() {
    const searchTerm = els.searchResults.value.toLowerCase();
    const severityFilters = Array.from(document.querySelectorAll('[data-severity]:checked'))
        .map(cb => cb.dataset.severity);
    
    document.querySelectorAll('.optimization-card').forEach(card => {
        const matchesSearch = searchTerm === '' || 
            card.textContent.toLowerCase().includes(searchTerm);
        const matchesSeverity = severityFilters.includes(card.dataset.severity);
        
        card.style.display = matchesSearch && matchesSeverity ? 'block' : 'none';
    });
}

// History management
function saveToHistory(analysis) {
    analysisHistory.unshift(analysis);
    if (analysisHistory.length > 10) analysisHistory.pop();
    localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
}

function loadHistory() {
    const saved = localStorage.getItem('analysisHistory');
    if (saved) {
        analysisHistory = JSON.parse(saved);
    }
}

function showHistory() {
    // TODO: Implement history modal
    showNotification('History feature coming soon!', 'info');
}

// Stats
function updateStats() {
    els.totalAnalyses.textContent = analysisHistory.length;
    if (analysisHistory.length > 0) {
        const avgScore = Math.round(
            analysisHistory.reduce((sum, a) => sum + a.overall_score, 0) / analysisHistory.length
        );
        els.avgScore.textContent = avgScore;
    } else {
        els.avgScore.textContent = '--';
    }
}

// Export
function exportResults() {
    if (!currentAnalysis) {
        showNotification('No analysis to export', 'warning');
        return;
    }
    
    const markdown = generateMarkdownReport(currentAnalysis);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gpu-optimization-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Report exported successfully', 'success');
}

function generateMarkdownReport(analysis) {
    let md = `# GPU Code Optimization Report\n\n`;
    md += `**Date:** ${new Date(analysis.timestamp).toLocaleString()}\n`;
    md += `**Language:**${analysis.language}\n`;
    md += `**Model:** ${analysis.model_used}\n`;
    md += `**Overall Score:** ${analysis.overall_score}/100\n\n`;
    md += `## Summary\n\n${analysis.summary}\n\n`;
    md += `## Optimizations (${analysis.optimizations.length})\n\n`;
    
    analysis.optimizations.forEach((opt, i) => {
        md += `### ${i + 1}. ${opt.issue}\n\n`;
        md += `**Category:** ${opt.category}\n`;
        md += `**Severity:** ${opt.severity}\n\n`;
        md += `**Suggestion:** ${opt.suggestion}\n\n`;
        if (opt.code_snippet) {
            md += `**Optimized Code:**\n\`\`\`${analysis.language}\n${opt.code_snippet}\n\`\`\`\n\n`;
        }
        if (opt.estimated_speedup) {
            md += `**Estimated Speedup:** ${opt.estimated_speedup}\n\n`;
        }
        md += `---\n\n`;
    });
    
    return md;
}

// Compare mode
function toggleCompareMode() {
    showNotification('Compare mode coming soon!', 'info');
}

// Modal controls
function showExamplesModal() {
    els.examplesModal.classList.add('active');
}

function hideExamplesModal() {
    els.examplesModal.classList.remove('active');
}

// Display error
function displayError(message) {
    els.resultsContainer.innerHTML = `
        <div class="error-state">
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="30" cy="30" r="25"/>
                <line x1="30" y1="20" x2="30" y2="35"/>
                <circle cx="30" cy="42" r="1.5" fill="currentColor"/>
            </svg>
            <h3>Analysis Error</h3>
            <p>${escapeHtml(message)}</p>
            <div class="troubleshoot">
                <strong>Troubleshooting:</strong>
                <ul>
                    <li>Ensure Ollama is running</li>
                    <li>Verify Nemotron model is installed</li>
                    <li>Check your code syntax</li>
                </ul>
            </div>
        </div>
    `;
}

// Notifications
function showNotification(message, type = 'info') {
    // TODO: Implement toast notification system
    console.log(`[${type}] ${message}`);
}

// Health check on load
fetch(`${API_BASE}/api/health`)
    .then(res => res.json())
    .then(health => {
        if (!health.ollama_available) {
            showNotification('Ollama is not available. Please ensure it is running.', 'warning');
        }
    })
    .catch(err => console.error('Health check failed:', err));
