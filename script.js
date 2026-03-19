const resultEl     = document.getElementById('result');
const expressionEl = document.getElementById('expression');

let expression    = '';
let lastWasEqual  = false;

function updateDisplay(value, callback) {
  resultEl.style.fontSize = value.length > 12 ? '24px' : '40px';
  resultEl.textContent    = value;
  if (typeof callback === 'function') {
    callback(value);
  }
}

function onDisplayUpdate(value) {
  console.log('[Display atualizado]', value);
}

function onCalculate(expr, result) {
  console.log(`[Cálculo] ${expr} = ${result}`);
}

function onError(expr) {
  console.warn('[Erro] Expressão inválida:', expr);
}

function clearAll() {
  expression   = '';
  lastWasEqual = false;
  expressionEl.textContent = '';
  updateDisplay('0', onDisplayUpdate);
}

function backspace() {
  if (lastWasEqual) {
    clearAll();
    return;
  }
  expression = expression.slice(0, -1);
  updateDisplay(expression || '0', onDisplayUpdate);
}

function processInput(value, validationCallback) {
  if (typeof validationCallback === 'function' && !validationCallback(value, expression)) {
    return;
  }
  expression += value;
  updateDisplay(expression, onDisplayUpdate);
}

function validationCallback(value, currentExpr) {
  const operators = ['+', '-', '*', '/'];
  const lastChar  = currentExpr.slice(-1);

  if (operators.includes(value) && operators.includes(lastChar)) {
    expression = currentExpr.slice(0, -1) + value;
    updateDisplay(expression, onDisplayUpdate);
    return false;
  }

  if (value === '.') {
    const parts       = currentExpr.split(/[+\-*/]/);
    const currentPart = parts[parts.length - 1];
    if (currentPart.includes('.')) return false;
  }

  if (currentExpr === '' && operators.includes(value) && value !== '-') return false;

  return true;
}

function appendValue(value) {
  const operators = ['+', '-', '*', '/'];

  if (lastWasEqual) {
    expression   = operators.includes(value) ? resultEl.textContent + value : value;
    lastWasEqual = false;
    expressionEl.textContent = '';
    updateDisplay(expression, onDisplayUpdate);
    return;
  }

  processInput(value, validationCallback);
}

function calculate(successCallback, errorCallback) {
  if (!expression) return;

  try {
    expressionEl.textContent = expression + ' =';
    const evaluated = Function('"use strict"; return (' + expression + ')')();
    const result    = parseFloat(evaluated.toFixed(10)).toString();

    updateDisplay(result, onDisplayUpdate);
    expression   = result;
    lastWasEqual = true;

    if (typeof successCallback === 'function') {
      successCallback(expressionEl.textContent, result);
    }

  } catch (e) {
    updateDisplay('Erro', onDisplayUpdate);
    expression   = '';
    lastWasEqual = false;
    expressionEl.textContent = '';

    if (typeof errorCallback === 'function') {
      errorCallback(expression);
    }
  }
}

const actionCallbacks = {
  clear    : () => clearAll(),
  backspace: () => backspace(),
  equal    : () => calculate(onCalculate, onError),
};

function resolveAction(action, value) {
  if (action && actionCallbacks[action]) {
    actionCallbacks[action]();
  } else if (value !== undefined) {
    appendValue(value);
  }
}

document.querySelector('.buttons').addEventListener('click', function (e) {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  resolveAction(btn.dataset.action, btn.dataset.value);
});

const keyCallbacks = {
  Enter    : () => calculate(onCalculate, onError),
  '='      : () => calculate(onCalculate, onError),
  Backspace: () => backspace(),
  Escape   : () => clearAll(),
};

document.addEventListener('keydown', function (e) {
  const key = e.key;
  if (key === '/') e.preventDefault();
  if (keyCallbacks[key]) {
    keyCallbacks[key]();
  } else if (/^[0-9+\-*/.]+$/.test(key)) {
    appendValue(key);
  }
});
