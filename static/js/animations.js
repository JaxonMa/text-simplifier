// animations.js — animation and visual feedback control
// -----------------------------------------------------------------------------
// This file owns every piece of animation / visual feedback in the UI:
// the model configuration panel open/close height animation, the status
// bubble, and the button "success" checkmark animation.
//
// It is loaded before logic.js. It is self-contained: the only DOM element it
// reaches out to is #configPanel (via getElementById inside DOMContentLoaded),
// and every other element it animates is passed in as an argument by logic.js.
// -----------------------------------------------------------------------------

// ===== Status Bubble =====
// Timer shared by showBubble() so consecutive bubbles replace each other.
let bubbleTimer;

function showBubble(bubble, message) {
    clearTimeout(bubbleTimer);
    bubble.textContent = message;
    bubble.classList.add('visible');
    bubbleTimer = setTimeout(() => {
        bubble.classList.remove('visible');
    }, 2500);
}

// ===== Model Configuration Panel Animation =====
function openModelMenu(panel, badgeBtn) {
    panel.classList.add('open');
    badgeBtn.classList.add('open');
    badgeBtn.setAttribute('aria-expanded', 'true');

    // Measure the natural height, then animate from 0 up to it
    panel.style.height = 'auto';
    const targetHeight = panel.offsetHeight;
    panel.style.height = '0px';
    void panel.offsetHeight; // force reflow so the transition starts from 0
    panel.style.height = targetHeight + 'px';
}

function closeModelMenu(panel, badgeBtn) {
    // Start collapsing from the current height (works mid-animation too)
    panel.style.height = panel.getBoundingClientRect().height + 'px';
    void panel.offsetHeight; // force reflow so the transition starts from here

    panel.classList.remove('open');
    badgeBtn.classList.remove('open');
    badgeBtn.setAttribute('aria-expanded', 'false');

    panel.style.height = '0px';
}

// Release the fixed height once the open animation finishes so the panel
// stays responsive to window resizes
document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('configPanel');
    if (!panel) return;

    panel.addEventListener('transitionend', (e) => {
        if (e.target !== panel || e.propertyName !== 'height') return;
        if (panel.classList.contains('open')) {
            panel.style.height = 'auto';
        }
    });
});

// ===== Button Success Animation =====
function showButtonSuccess(button) {
    if (!button) return;

    const iconElement = button.querySelector('.btn-icon');
    const textElement = button.querySelector('.btn-text');
    const originalIconMarkup = iconElement ? iconElement.innerHTML : null;

    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';
    checkmark.textContent = '✓';

    button.classList.add('btn-success');

    if (iconElement) {
        // Icon buttons swap the icon for a checkmark; any accompanying text is left untouched.
        button.classList.add('icon-only');
        iconElement.innerHTML = '';
        iconElement.appendChild(checkmark);
    } else if (textElement) {
        button.insertBefore(checkmark, textElement);
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
