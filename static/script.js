// GPU Code Optimizer AI - Frontend JavaScript

const API_BASE = '';

// DOM Elements
const codeInput = document.getElementById('codeInput');
const languageSelect = document.getElementById('languageSelect');
const modelSelect = document.getElementById('modelSelect');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const examplesBtn = document.getElementById('examplesBtn');
const resultsContainer = document.getElementById('resultsContainer');
const statusIndicator = document.getElementById('statusIndicator');
const examplesModal = document.getElementById('examplesModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadModels();
    loadExamples();
    setupEventListeners();
});

function setupEventListeners() {
    analyzeBtn.addEventListener('click', analyzeCode);
    clearBtn.addEventListener('click', clearCode);
    examplesBtn.addEventListener('click', showExamplesModal);
    
    // Modal close handlers
    const modalClose = document.querySelector('.modal-close');
    modalClose.addEventListener('click', hideExamplesModal);
    examplesModal.addEventListener('click', (e) => {
        if (e.target === examplesModal) {
            hideExamplesModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            analyzeCode();
        }
    });
}

async function loadModels() {
    try {
        const response = await fetch(`${API_BASE}/api/models`);
        const data = await response.json();
        
        modelSelect.innerHTML = '';
        
        if (data.models && data.models.length > 0) {
            // Prioritize Nemotron models
            const nemotronModels = data.models.filter(m => m.toLowerCase().includes('nemotron'));
            const otherModels = data.models.filter(m => !m.toLowerCase().includes('nemotron'));
            
            if (nemotronModels.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = 'NVIDIA Nemotron (Recommended)';
                nemotronModels.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    optgroup.appendChild(option);
                });
                modelSelect.appendChild(optgroup);
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
                modelSelect.appendChild(optgroup);
            }
        } else {
            modelSelect.innerHTML = '<option value="nemotron">nemotron (default)</option>';
        }
    } catch (error) {
        console.error('Failed to load models:', error);
        modelSelect.innerHTML = '<option value="nemotron">nemotron (default)</option>';
    }
}

async function loadExamples() {
    try {
        const response = await fetch(`${API_BASE}/api/examples`);
        const examples = await response.json();
        
        const examplesList = document.getElementById('examplesList');
        examplesList.innerHTML = '';
        
        Object.entries(examples).forEach(([key, example]) => {
            const card = document.createElement('div');
            card.className = 'example-card';
            card.innerHTML = `
                <h3>${example.name}</h3>
                <span class="language-tag">${example.language.toUpperCase()}</span>
                <pre><code>${escapeHtml(example.code)}</code></pre>
            `;
            card.addEventListener('click', () => loadExample(example));
            examplesList.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load examples:', error);
    }
}

function loadExample(example) {
    codeInput.value = example.code;
    languageSelect.value = example.language;
    hideExamplesModal();
    // Auto-focus on code input
    codeInput.focus();
}

function showExamplesModal() {
    examplesModal.classList.add('active');
}

function hideExamplesModal() {
    examplesModal.classList.remove('active');
}

async function analyzeCode() {
    const code = codeInput.value.trim();
    
    if (!code) {
        alert('Please enter some code to analyze');
        return;
    }
    
    // Update UI to analyzing state
    setAnalyzingState(true);
    
    try {
        const response = await fetch(`${API_BASE}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                language: languageSelect.value,
                model: modelSelect.value
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Analysis failed');
        }
        
        const results = await response.json();
        displayResults(results);
        
    } catch (error) {
        console.error('Analysis error:', error);
        displayError(error.message);
    } finally {
        setAnalyzingState(false);
    }
}

function setAnalyzingState(analyzing) {
    analyzeBtn.disabled = analyzing;
    const statusText = statusIndicator.querySelector('.status-text');
    
    if (analyzing) {
        statusIndicator.classList.add('analyzing');
        statusText.textContent = 'Analyzing...';
        analyzeBtn.innerHTML = 'Analyzing...';
        
        // Show loading in results
        resultsContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
        `;
    } else {
        statusIndicator.classList.remove('analyzing');
        statusText.textContent = 'Ready';
        analyzeBtn.innerHTML = 'Analyze & Optimize';
    }
}

function displayResults(results) {
    resultsContainer.innerHTML = '';
    
    // Create summary section
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'analysis-summary';
    summaryDiv.innerHTML = `
        <h3>Analysis Summary</h3>
        <p>${escapeHtml(results.summary)}</p>
        <div class="score-display">
            <div>
                <strong>Model Used:</strong> ${escapeHtml(results.model_used)}<br>
                <strong>Optimizations Found:</strong> ${results.optimizations.length}
            </div>
            <div class="score-circle" style="--score-deg: ${results.overall_score * 3.6}deg">
                <span>${results.overall_score}</span>
            </div>
        </div>
    `;
    resultsContainer.appendChild(summaryDiv);
    
    // Create optimization cards
    if (results.optimizations.length === 0) {
        const noOptimizations = document.createElement('div');
        noOptimizations.className = 'empty-state';
        noOptimizations.innerHTML = `
            <div class="empty-icon">OK</div>
            <h3>No Major Issues Found</h3>
            <p>Your code looks well-optimized for GPU execution!</p>
        `;
        resultsContainer.appendChild(noOptimizations);
    } else {
        results.optimizations.forEach(opt => {
            const card = createOptimizationCard(opt);
            resultsContainer.appendChild(card);
        });
    }
}

function createOptimizationCard(optimization) {
    const card = document.createElement('div');
    card.className = `optimization-card ${optimization.severity}`;
    
    let content = `
        <div class="optimization-header">
            <span class="optimization-category">${escapeHtml(optimization.category)}</span>
            <span class="severity-badge ${optimization.severity}">${escapeHtml(optimization.severity)}</span>
        </div>
        <div class="optimization-issue">${escapeHtml(optimization.issue)}</div>
        <div class="optimization-suggestion">${escapeHtml(optimization.suggestion)}</div>
    `;
    
    if (optimization.code_snippet) {
        content += `
            <div class="code-snippet">
                <pre><code>${escapeHtml(optimization.code_snippet)}</code></pre>
            </div>
        `;
    }
    
    if (optimization.estimated_speedup) {
        content += `
            <div class="speedup-badge">
                SPEEDUP: ${escapeHtml(optimization.estimated_speedup)}
            </div>
        `;
    }
    
    card.innerHTML = content;
    return card;
}

function displayError(message) {
    resultsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">!</div>
            <h3>Analysis Error</h3>
            <p>${escapeHtml(message)}</p>
            <p style="margin-top: 20px;">
                <strong>Troubleshooting:</strong><br>
                - Ensure Ollama is running<br>
                - Verify Nemotron model is installed<br>
                - Check your code syntax
            </p>
        </div>
    `;
}

function clearCode() {
    codeInput.value = '';
    resultsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">⚡</div>
            <h3>Ready to Optimize</h3>
            <p>Enter your GPU code and click "Analyze & Optimize" to get started.</p>
            <div class="feature-grid">
                <div class="feature-item">
                    <span class="feature-icon">▶</span>
                    <span>Memory Coalescing</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">⚡</span>
                    <span>Kernel Fusion</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">■</span>
                    <span>Shared Memory</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">●</span>
                    <span>Tensor Cores</span>
                </div>
            </div>
        </div>
    `;
    codeInput.focus();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check backend health on load
fetch(`${API_BASE}/api/health`)
    .then(res => res.json())
    .then(health => {
        if (!health.ollama_available) {
            console.warn('Ollama is not available:', health.error);
            alert('Warning: Ollama is not detected. Please ensure Ollama is running and Nemotron model is installed.');
        }
    })
    .catch(err => {
        console.error('Failed to check backend health:', err);
    });
