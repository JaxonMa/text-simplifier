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
//   Note: submitting the config that is already active returns HTTP 400
//   ("client already created"), not 200.
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
    themeToggle: document.getElementById('themeToggle'),
    configPanel: document.getElementById('configPanel'),
    confirmBtn: document.getElementById('confirmBtn'),
    simplifyBtn: document.getElementById('simplifyBtn'),
    pasteBtn: document.getElementById('pasteBtn'),
    copyBtn: document.getElementById('copyBtn'),
    clearBtn: document.getElementById('clearBtn'),
    configModel: document.getElementById('configModel'),
    configBaseUrl: document.getElementById('configBaseUrl'),
    configApiKey: document.getElementById('configApiKey'),
    inputWordCount: document.getElementById('inputWordCount'),
    outputWordCount: document.getElementById('outputWordCount')
};

// ===== Theme Management =====
// The user's choice ("light" | "dark") is persisted in localStorage. On the
// very first visit (no stored choice yet) the theme is picked from the clock
// instead — dark from 6 PM until 6 AM, light otherwise. The effective theme
// is applied to <html data-theme="...">; the dark styles live under the
// [data-theme="dark"] selectors in index.css.
// NOTE: keep the dark hours in sync with the inline theme script in
// templates/index.html (it applies the theme before first paint).
const THEME_MODE_KEY = 'themeMode';
const DARK_START_HOUR = 18; // dark from 6 PM ...
const DARK_END_HOUR = 6;    // ... until 6 AM

const SUN_ICON = '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
const MOON_ICON = '<svg viewBox="0 0 24 24" class="icon-svg" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function getThemeByTime() {
    const hour = new Date().getHours();
    return (hour >= DARK_START_HOUR || hour < DARK_END_HOUR) ? 'dark' : 'light';
}

function getStoredTheme() {
    try {
        const saved = localStorage.getItem(THEME_MODE_KEY);
        if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
        // localStorage unavailable — fall back to a time-based pick below
    }
    return null;
}

// First visit (or unavailable storage): pick by the clock. The pick is
// persisted, so the automatic choice only ever happens once.
function getInitialTheme() {
    return getStoredTheme() || getThemeByTime();
}

function setStoredTheme(theme) {
    try {
        localStorage.setItem(THEME_MODE_KEY, theme);
    } catch (e) {
        // Non-persistent; the change still applies for this session.
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

function updateThemeToggle(button, theme) {
    if (!button) return;

    const iconElement = button.querySelector('.btn-icon');
    if (iconElement) {
        iconElement.innerHTML = theme === 'dark' ? MOON_ICON : SUN_ICON;
    }

    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    button.title = `Theme: ${theme} — switch to ${nextTheme}`;
    button.setAttribute('aria-label', `Theme: ${theme}`);
    button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}

function handleThemeToggle() {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setStoredTheme(nextTheme);
    applyTheme(nextTheme);
    updateThemeToggle(elements.themeToggle, nextTheme);
}

// Apply the theme as early as possible, and persist the first (time-based) pick
// so the automatic choice only ever happens once. The toggle button already
// exists at this point (this script runs after the header markup), so sync its
// icon right away too.
const initialTheme = getInitialTheme();
setStoredTheme(initialTheme);
applyTheme(initialTheme);
updateThemeToggle(elements.themeToggle, initialTheme);

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
    //
    // Since the backend refactor, re-submitting the config that is already
    // active returns 400 ("client already created"). Here that only happens
    // when the server already holds this exact config (a backend restart
    // resets it, making the re-submit succeed), so the client is set up.
    if (state.config.apiKey) {
        try {
            await submitConfig(state.config);
            state.isConfigured = true;
        } catch (e) {
            state.isConfigured = /already created/i.test(e.message);
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
// Returns true when a simplification request is already in flight, in which
// case the change only takes effect from the next simplification onward.
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

    return state.isProcessing;
}

// Bubble feedback after a config save. When a request is in flight, tell the
// user the new config applies from the next simplification on.
function showConfigSaveFeedback(pending) {
    showBubble(elements.modelBubble, pending
        ? 'Changes will take effect on the next simplification'
        : 'Changes saved');
}

function discardConfigChanges() {
    syncConfigInputs();
}

async function toggleModelMenu() {
    if (elements.configPanel.classList.contains('open')) {
        if (isConfigDirty()) {
            if (confirm('Save changes to model configuration?')) {
                try {
                    const pending = await saveConfig();
                    closeModelMenu(elements.configPanel, elements.modelBadgeBtn);
                    showConfigSaveFeedback(pending);
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
            const pending = await saveConfig();
            showConfigSaveFeedback(pending);
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
    setBusyButtons(true);
    setLoadingUI(true);

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
        setLoadingUI(false);
        setBusyButtons(false);
        state.isProcessing = false;
    }
}

// ===== Loading State =====
// Disable the action buttons while a simplification request is in flight
function setBusyButtons(disabled) {
    [elements.simplifyBtn, elements.pasteBtn, elements.clearBtn].forEach((btn) => {
        btn.disabled = disabled;
    });
}

// Swap the simplify button icon for a spinner and show the "Simplifying..."
// loading indicator in the output panel (which is cleared meanwhile)
function setLoadingUI(isLoading) {
    elements.simplifyBtn.classList.toggle('loading', isLoading);
    elements.outputDisplay.classList.toggle('loading', isLoading);

    if (isLoading) {
        displayResult('');
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

    updateOutputWordCount();
}

// ===== Word Counts =====
// Count words in mixed-script text (Latin, CJK, Thai, ...). The native
// Intl.Segmenter segments scripts without word separators (Chinese, Japanese,
// Thai, ...) into proper words; the fallback counts whitespace-delimited
// tokens and treats every CJK character as one token.
function countWords(text) {
    if (!text.trim()) return 0;

    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
        let count = 0;
        for (const segment of segmenter.segment(text)) {
            if (segment.isWordLike) count += 1;
        }
        return count;
    }

    // Fallback for older browsers: whitespace-separated tokens, with every
    // Han/Hiragana/Katakana/Hangul character counted as its own token.
    const tokens = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[^\s]+/gu) || [];
    return tokens.length;
}

function updateInputWordCount() {
    elements.inputWordCount.textContent = countWords(elements.inputText.value);
}

function updateOutputWordCount() {
    elements.outputWordCount.textContent = countWords(elements.outputText.value);
}

// ===== Button Actions =====
async function pasteFromClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
        alert('Clipboard API is not available in this context.');
        return;
    }

    let text;
    try {
        text = await navigator.clipboard.readText();
    } catch (error) {
        console.error('Failed to read clipboard:', error);
        alert(`Failed to read clipboard: ${error.message || 'unknown error'}`);
        return;
    }

    if (!text) {
        return;
    }

    const input = elements.inputText;
    let start;
    let end;
    if (document.activeElement === input) {
        // Insert at the current cursor/selection position
        start = input.selectionStart;
        end = input.selectionEnd;
    } else {
        // Otherwise append to the end of the input
        start = end = input.value.length;
    }

    input.value = input.value.slice(0, start) + text + input.value.slice(end);

    // Put the cursor right after the pasted text
    input.focus();
    const cursor = start + text.length;
    input.setSelectionRange(cursor, cursor);

    // Programmatic value changes do not fire the input event, so keep the
    // debounced sessionStorage autosave in sync immediately.
    try {
        sessionStorage.setItem('inputText', input.value);
    } catch (e) {
        console.warn('Failed to save input:', e);
    }

    updateInputWordCount();
    showButtonSuccess(elements.pasteBtn);
}

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
        updateInputWordCount();
        showButtonSuccess(elements.clearBtn);
    }
}

// ===== Event Listeners =====
elements.simplifyBtn.addEventListener('click', simplifyText);
elements.pasteBtn.addEventListener('click', pasteFromClipboard);
elements.copyBtn.addEventListener('click', copyToClipboard);
elements.clearBtn.addEventListener('click', clearAll);
elements.modelBadgeBtn.addEventListener('click', toggleModelMenu);
elements.confirmBtn.addEventListener('click', confirmChanges);

// Keep focus in the input textarea when the paste button is clicked, so the
// pasted text lands at the current cursor position instead of appending.
elements.pasteBtn.addEventListener('mousedown', (e) => e.preventDefault());

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
    updateInputWordCount();
    updateOutputWordCount();

    // Theme toggle: reflect the current theme and handle manual switching
    updateThemeToggle(elements.themeToggle, document.documentElement.getAttribute('data-theme') || 'light');
    elements.themeToggle.addEventListener('click', handleThemeToggle);
});

// ===== Auto-save input text to sessionStorage =====
let inputTimeout;
elements.inputText.addEventListener('input', () => {
    updateInputWordCount();
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

    updateInputWordCount();
});
