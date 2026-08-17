// logic.js — business logic and backend communication
// -----------------------------------------------------------------------------
// This file owns all application logic: state, model configuration handling,
// talking to the Flask backend, simplification, clipboard/copy actions, event
// wiring and initialization. All visual feedback it needs (bubbles, panel
// height animation, button success animation) is delegated to animations.js.
//
// Backend contract (see app.py):
//   POST /api/submit-model-config        body: {base_url, model, api_key}
//   POST /api/simplify-text/<original_text>
//   Both reply with JSON {status, type, message}.
// -----------------------------------------------------------------------------

// ===== State Management =====
const state = {
    config: {
        baseUrl: '',
        model: '',
        apiKey: ''
    },
    isProcessing: false,
    // Whether the backend has created a client for the current config
    isConfigured: false
};

// ===== DOM Elements =====
const elements = {
    inputText: document.getElementById('inputText'),
    outputText: document.getElementById('outputText'),
    outputDisplay: document.getElementById('outputDisplay'),
    modelDisplay: document.getElementById('modelDisplay'),
    modelBadgeBtn: document.getElementById('modelBadgeBtn'),
    modelBubble: document.getElementById('modelBubble'),
    configPanel: document.getElementById('configPanel'),
    confirmBtn: document.getElementById('confirmBtn'),
    simplifyBtn: document.getElementById('simplifyBtn'),
    copyBtn: document.getElementById('copyBtn'),
    clearBtn: document.getElementById('clearBtn'),
    configModel: document.getElementById('configModel'),
    configBaseUrl: document.getElementById('configBaseUrl'),
    configApiKey: document.getElementById('configApiKey')
};

// ===== Backend Communication =====
// POST JSON to a backend endpoint and resolve with the parsed body when the
// request succeeds; throw an Error carrying the backend's message otherwise.
async function postJson(url, body) {
    const options = { method: 'POST' };
    if (body !== undefined) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }

    if (!response.ok || !data || data.status !== 'success') {
        const message = (data && data.message) || `API error: ${response.statusText}`;
        throw new Error(message);
    }

    return data;
}

// Submit the model config to the backend, which creates the model client there.
async function submitConfig(config) {
    const data = await postJson('/api/submit-model-config', {
        base_url: config.baseUrl,
        model: config.model,
        api_key: config.apiKey
    });
    return data.message;
}

// ===== Configuration Management =====
async function loadConfig() {
    try {
        // Try to load from localStorage first
        const saved = localStorage.getItem('simplifierConfig');
        if (saved) {
            const parsed = JSON.parse(saved);
            state.config = { ...state.config, ...parsed };
        }
    } catch (e) {
        console.warn('Failed to load config from localStorage:', e);
    }

    syncConfigInputs();
    updateModelBadge();

    // Best effort: re-register the saved config with the backend so that
    // simplifying still works right after a page refresh. The client is
    // created server-side, so a refresh or a backend restart loses it.
    if (state.config.apiKey) {
        try {
            await submitConfig(state.config);
            state.isConfigured = true;
        } catch (e) {
            state.isConfigured = false;
            console.warn('Failed to re-submit saved config:', e);
        }
    }
}

function syncConfigInputs() {
    elements.configModel.value = state.config.model;
    elements.configBaseUrl.value = state.config.baseUrl;
    elements.configApiKey.value = state.config.apiKey;
}

function updateModelBadge() {
    elements.modelDisplay.textContent = state.config.model || 'Not set';
}

function readConfigInputs() {
    return {
        baseUrl: elements.configBaseUrl.value,
        model: elements.configModel.value,
        apiKey: elements.configApiKey.value
    };
}

function isConfigDirty() {
    const inputs = readConfigInputs();
    return inputs.baseUrl !== state.config.baseUrl ||
        inputs.model !== state.config.model ||
        inputs.apiKey !== state.config.apiKey;
}

// Validate with the backend, then persist the config locally on success.
async function saveConfig() {
    const config = readConfigInputs();

    await submitConfig(config);

    state.config = config;
    state.isConfigured = true;

    try {
        localStorage.setItem('simplifierConfig', JSON.stringify(state.config));
    } catch (e) {
        console.error('Failed to save config:', e);
    }

    updateModelBadge();
}

function discardConfigChanges() {
    syncConfigInputs();
}

async function toggleModelMenu() {
    if (elements.configPanel.classList.contains('open')) {
        if (isConfigDirty()) {
            if (confirm('Save changes to model configuration?')) {
                try {
                    await saveConfig();
                    closeModelMenu(elements.configPanel, elements.modelBadgeBtn);
                    showBubble(elements.modelBubble, 'Changes saved');
                } catch (error) {
                    console.error('Failed to save config:', error);
                    // Keep the panel open so the user can fix the configuration
                    showBubble(elements.modelBubble, error.message || 'Failed to save changes');
                }
            } else {
                discardConfigChanges();
                closeModelMenu(elements.configPanel, elements.modelBadgeBtn);
                showBubble(elements.modelBubble, 'Changes discarded');
            }
        } else {
            closeModelMenu(elements.configPanel, elements.modelBadgeBtn);
        }
    } else {
        openModelMenu(elements.configPanel, elements.modelBadgeBtn);
    }
}

async function confirmChanges() {
    if (isConfigDirty()) {
        try {
            await saveConfig();
            showBubble(elements.modelBubble, 'Changes saved');
        } catch (error) {
            console.error('Failed to save config:', error);
            // Keep the panel open so the user can fix the configuration
            showBubble(elements.modelBubble, error.message || 'Failed to save changes');
            return;
        }
    }
    closeModelMenu(elements.configPanel, elements.modelBadgeBtn);
}

// ===== Simplification Logic =====
async function simplifyText() {
    if (state.isProcessing) return;

    const text = elements.inputText.value.trim();

    if (!text) {
        alert('Please enter some text to simplify.');
        return;
    }

    if (!state.isConfigured) {
        alert('Please configure your model first.');
        return;
    }

    state.isProcessing = true;
    elements.simplifyBtn.disabled = true;

    try {
        // The original text travels in the URL path, per the backend route
        // POST /api/simplify-text/<string:original_text>; the reply carries
        // the simplified text in the "message" field.
        const data = await postJson(`/api/simplify-text/${encodeURIComponent(text)}`);

        displayResult(data.message);
        showButtonSuccess(elements.simplifyBtn);
    } catch (error) {
        console.error('Error during simplification:', error);
        alert(`Error: ${error.message}`);
        displayResult(`Error: ${error.message}`);
    } finally {
        state.isProcessing = false;
        elements.simplifyBtn.disabled = false;
    }
}

function displayResult(text) {
    if (text) {
        elements.outputText.value = text;
        elements.outputDisplay.setAttribute('data-empty', 'false');
        elements.copyBtn.disabled = false;
    } else {
        elements.outputText.value = '';
        elements.outputDisplay.setAttribute('data-empty', 'true');
        elements.copyBtn.disabled = true;
    }
}

// ===== Button Actions =====
function copyToClipboard() {
    const text = elements.outputText.value;

    if (!text) {
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            showButtonSuccess(elements.copyBtn);
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
        });
}

function clearAll() {
    if (confirm('Clear all text? This action cannot be undone.')) {
        elements.inputText.value = '';
        displayResult('');
        elements.inputText.focus();
        showButtonSuccess(elements.clearBtn);
    }
}

// ===== Event Listeners =====
elements.simplifyBtn.addEventListener('click', simplifyText);
elements.copyBtn.addEventListener('click', copyToClipboard);
elements.clearBtn.addEventListener('click', clearAll);
elements.modelBadgeBtn.addEventListener('click', toggleModelMenu);
elements.confirmBtn.addEventListener('click', confirmChanges);

// Allow simplify on Ctrl+Enter
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (elements.inputText === document.activeElement) {
            simplifyText();
        }
    }
});

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    elements.copyBtn.disabled = true; // Copy is disabled until there's output
    elements.inputText.focus();
});

// ===== Auto-save input text to sessionStorage =====
let inputTimeout;
elements.inputText.addEventListener('input', () => {
    clearTimeout(inputTimeout);
    inputTimeout = setTimeout(() => {
        try {
            sessionStorage.setItem('inputText', elements.inputText.value);
        } catch (e) {
            console.warn('Failed to save input:', e);
        }
    }, 500);
});

// ===== Restore input text on page load =====
document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = sessionStorage.getItem('inputText');
        if (saved) {
            elements.inputText.value = saved;
        }
    } catch (e) {
        console.warn('Failed to restore input:', e);
    }
});
