// ===== State Management =====
const state = {
    config: {
        baseUrl: '',
        model: '',
        apiKey: ''
    },
    isProcessing: false
};

// ===== DOM Elements =====
const elements = {
    inputText: document.getElementById('inputText'),
    outputText: document.getElementById('outputText'),
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

// ===== Configuration Management =====
let bubbleTimer;

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

function saveConfig() {
    state.config = readConfigInputs();

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

function openModelMenu() {
    elements.configPanel.hidden = false;
    elements.modelBadgeBtn.classList.add('open');
    elements.modelBadgeBtn.setAttribute('aria-expanded', 'true');
}

function closeModelMenu() {
    elements.configPanel.hidden = true;
    elements.modelBadgeBtn.classList.remove('open');
    elements.modelBadgeBtn.setAttribute('aria-expanded', 'false');
}

function toggleModelMenu() {
    if (!elements.configPanel.hidden) {
        if (isConfigDirty()) {
            if (confirm('Save changes to model configuration?')) {
                saveConfig();
                closeModelMenu();
                showBubble('Changes saved');
            } else {
                discardConfigChanges();
                closeModelMenu();
                showBubble('Changes discarded');
            }
        } else {
            closeModelMenu();
        }
    } else {
        openModelMenu();
    }
}

function confirmChanges() {
    if (isConfigDirty()) {
        saveConfig();
        showBubble('Changes saved');
    }
    closeModelMenu();
}

function showBubble(message) {
    clearTimeout(bubbleTimer);
    elements.modelBubble.textContent = message;
    elements.modelBubble.classList.add('visible');
    bubbleTimer = setTimeout(() => {
        elements.modelBubble.classList.remove('visible');
    }, 2500);
}

// ===== Simplification Logic =====
async function simplifyText() {
    const text = elements.inputText.value.trim();

    if (!text) {
        alert('Please enter some text to simplify.');
        return;
    }

    if (!state.config.apiKey) {
        alert('Please configure your API key first.');
        return;
    }

    state.isProcessing = true;
    elements.simplifyBtn.disabled = true;

    try {
        // Send request to backend API
        const response = await fetch('/api/simplify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                model: state.config.model,
                baseUrl: state.config.baseUrl,
                apiKey: state.config.apiKey
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        const simplifiedText = data.simplified || data.result || '';

        // Display result
        displayResult(simplifiedText);

        // Show success animation
        showButtonSuccess(elements.simplifyBtn, true);
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
        elements.outputText.textContent = text;
        elements.outputText.setAttribute('data-empty', 'false');
        elements.copyBtn.disabled = false;
    } else {
        elements.outputText.innerHTML = '<span class="placeholder-text">Your simplified text will appear here</span>';
        elements.outputText.setAttribute('data-empty', 'true');
        elements.copyBtn.disabled = true;
    }
}

// ===== Button Actions =====
function copyToClipboard() {
    const text = elements.outputText.textContent;

    if (!text || elements.outputText.getAttribute('data-empty') === 'true') {
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            showButtonSuccess(elements.copyBtn, false);
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
        showButtonSuccess(elements.clearBtn, false);
    }
}

// ===== Success Animation =====
function showButtonSuccess(button, isTextButton = false) {
    if (!button) return;

    const isIconOnly = !button.querySelector('.btn-text');
    const iconElement = button.querySelector('.btn-icon');
    const originalIconMarkup = iconElement ? iconElement.innerHTML : null;

    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';
    checkmark.textContent = '✓';

    button.classList.add('btn-success');
    if (isIconOnly) {
        button.classList.add('icon-only');
    }

    if (isTextButton || !isIconOnly) {
        const textElement = button.querySelector('.btn-text');
        if (textElement) {
            button.insertBefore(checkmark, textElement);
        } else if (iconElement) {
            iconElement.innerHTML = '';
            iconElement.appendChild(checkmark);
        }
    } else if (iconElement) {
        iconElement.innerHTML = '';
        iconElement.appendChild(checkmark);
    }

    setTimeout(() => {
        button.classList.remove('btn-success', 'icon-only');

        const checkmarkEl = button.querySelector('.checkmark');
        if (checkmarkEl) {
            checkmarkEl.remove();
        }

        if (iconElement && originalIconMarkup) {
            iconElement.innerHTML = originalIconMarkup;
        }
    }, 1200);
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
