// ===== State Management =====
const state = {
    config: {
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        loop: true
    },
    isProcessing: false
};

// ===== DOM Elements =====
const elements = {
    inputText: document.getElementById('inputText'),
    outputText: document.getElementById('outputText'),
    modelDisplay: document.getElementById('modelDisplay'),
    simplifyBtn: document.getElementById('simplifyBtn'),
    copyBtn: document.getElementById('copyBtn'),
    clearBtn: document.getElementById('clearBtn'),
    configModel: document.getElementById('configModel'),
    configBaseUrl: document.getElementById('configBaseUrl'),
    configApiKey: document.getElementById('configApiKey'),
    configLoop: document.getElementById('configLoop')
};

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

    updateConfigDisplay();
}

function updateConfigDisplay() {
    elements.modelDisplay.textContent = state.config.model || 'gpt-4o-mini';
    elements.configModel.value = state.config.model;
    elements.configBaseUrl.value = state.config.baseUrl;
    elements.configApiKey.value = state.config.apiKey;
    elements.configLoop.checked = state.config.loop;
}

function saveConfig() {
    state.config.model = elements.configModel.value;
    state.config.baseUrl = elements.configBaseUrl.value;
    state.config.apiKey = elements.configApiKey.value;
    state.config.loop = elements.configLoop.checked;

    try {
        localStorage.setItem('simplifierConfig', JSON.stringify(state.config));
        updateConfigDisplay();
        showButtonSuccess(elements.configModel.parentElement.querySelector('button') || null);
    } catch (e) {
        console.error('Failed to save config:', e);
    }
}

// Watch for config changes and auto-save
elements.configModel.addEventListener('change', saveConfig);
elements.configBaseUrl.addEventListener('change', saveConfig);
elements.configApiKey.addEventListener('change', saveConfig);
elements.configLoop.addEventListener('change', saveConfig);

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

    const isIconOnly = !button.querySelector('.btn-text') || button.querySelector('.btn-text').style.display === 'none';

    // Create checkmark element
    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';
    checkmark.textContent = '✓';

    // Add success class
    button.classList.add('btn-success');
    if (isIconOnly) {
        button.classList.add('icon-only');
    }

    // Insert checkmark
    if (isTextButton || !isIconOnly) {
        // For text buttons, insert before text
        const textElement = button.querySelector('.btn-text');
        if (textElement) {
            button.insertBefore(checkmark, textElement);
        } else {
            button.prepend(checkmark);
        }
    } else {
        // For icon-only buttons, replace icon
        const iconElement = button.querySelector('.btn-icon');
        if (iconElement) {
            const originalIcon = iconElement.textContent;
            iconElement.textContent = '✓';
            iconElement.style.opacity = '1';
        }
    }

    // Revert after 1.2 seconds
    setTimeout(() => {
        button.classList.remove('btn-success', 'icon-only');

        // Remove checkmark if it was added as element
        const checkmarkEl = button.querySelector('.checkmark');
        if (checkmarkEl && !isIconOnly) {
            checkmarkEl.remove();
        }

        // Restore original icon
        const iconElement = button.querySelector('.btn-icon');
        if (isIconOnly && iconElement) {
            if (button.id === 'copyBtn') {
                iconElement.textContent = '📋';
            } else if (button.id === 'clearBtn') {
                iconElement.textContent = '🗑';
            } else if (button.id === 'simplifyBtn') {
                iconElement.textContent = '⚡';
            }
            iconElement.style.opacity = '1';
        }
    }, 1200);
}

// ===== Event Listeners =====
elements.simplifyBtn.addEventListener('click', simplifyText);
elements.copyBtn.addEventListener('click', copyToClipboard);
elements.clearBtn.addEventListener('click', clearAll);

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
