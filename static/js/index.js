// ---------- DOM Elements ----------
const inputField = document.getElementById('inputField');
const outputField = document.getElementById('outputField');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const simplifyBtn = document.getElementById('simplifyBtn');
const clearBtn = document.getElementById('clearBtn');
const clearInputBtn = document.getElementById('clearInputBtn');
const copyOutputBtn = document.getElementById('copyOutputBtn');
const modelStatus = document.getElementById('modelStatus');

// ---------- Helper: Update floating label state ----------
function updateFieldState(field) {
  const wrapper = field.closest('.text-field');
  if (field.value.length > 0 || document.activeElement === field) {
    wrapper.classList.add('active');
  } else {
    wrapper.classList.remove('active');
  }
}

// Attach input/focus/blur events to both textareas
[inputText, outputText].forEach(field => {
  field.addEventListener('input', () => updateFieldState(field));
  field.addEventListener('focus', () => updateFieldState(field));
  field.addEventListener('blur', () => updateFieldState(field));
});

// ---------- Simple Text Simplification (Mock) ----------
function simplifyText(text) {
  if (!text.trim()) return '';

  let result = text.trim().replace(/\s+/g, ' ');

  const replacements = [
    [/\bin order to\b/gi, 'to'],
    [/\bdue to the fact that\b/gi, 'because'],
    [/\bat this point in time\b/gi, 'now'],
    [/\bfor the purpose of\b/gi, 'for'],
    [/\bin the event that\b/gi, 'if'],
    [/\bwith regard to\b/gi, 'about'],
    [/\bwith respect to\b/gi, 'about'],
    [/\bin the near future\b/gi, 'soon'],
    [/\bhas the ability to\b/gi, 'can'],
    [/\bis able to\b/gi, 'can'],
    [/\butilize\b/gi, 'use'],
    [/\butilise\b/gi, 'use'],
    [/\bcommence\b/gi, 'start'],
    [/\bterminate\b/gi, 'end'],
    [/\bassist\b/gi, 'help'],
    [/\battempt\b/gi, 'try'],
    [/\brequire\b/gi, 'need'],
    [/\bobtain\b/gi, 'get'],
    [/\bprovide\b/gi, 'give'],
    [/\brequest\b/gi, 'ask'],
    [/\bresponse\b/gi, 'answer'],
    [/\badditional\b/gi, 'more'],
    [/\bnumerous\b/gi, 'many'],
    [/\bindividual\b/gi, 'person'],
    [/\bcurrently\b/gi, 'now'],
    [/\bsubsequently\b/gi, 'later'],
    [/\bprior to\b/gi, 'before'],
    [/\bafterwards\b/gi, 'later'],
  ];

  replacements.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, replacement);
  });

  return result;
}

// ---------- Simplify Button ----------
simplifyBtn.addEventListener('click', () => {
  const simplified = simplifyText(inputText.value);
  outputText.value = simplified;
  updateFieldState(outputText);
});

// ---------- Clear Button ----------
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  outputText.value = '';
  updateFieldState(inputText);
  updateFieldState(outputText);
  inputText.focus();
});

// ---------- Clear Input Icon Button ----------
clearInputBtn.addEventListener('click', () => {
  inputText.value = '';
  updateFieldState(inputText);
  inputText.focus();
});

// ---------- Copy Output Button ----------
copyOutputBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outputText.value);
    // Temporarily change icon to indicate success
    copyOutputBtn.textContent = '✓';
    setTimeout(() => {
      copyOutputBtn.textContent = '⧉';
    }, 1500);
  } catch (err) {
    alert('Failed to copy text.');
  }
});

// ---------- Ripple Effect ----------
document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// ---------- Initial State ----------
updateFieldState(inputText);
updateFieldState(outputText);