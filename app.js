(() => {
  const expressionDisplay = document.getElementById('expression');
  const resultDisplay = document.getElementById('result');
  const historyList = document.getElementById('history-list');
  const keyGrid = document.getElementById('key-grid');
  let expression = '';
  let answer = 0;
  let angleUnit = 'DEG';
  let justCalculated = false;
  const history = [];

  function formatNumber(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return String(value);
    if (Object.is(value, -0)) value = 0;
    if (Math.abs(value) >= 1e12 || (value !== 0 && Math.abs(value) < 1e-8)) {
      return value.toExponential(8).replace(/\.?(0+)e/, 'e');
    }
    return Number(value.toPrecision(12)).toString();
  }

  function render() {
    expressionDisplay.textContent = expression || '\u00a0';
    resultDisplay.classList.remove('error');
    resultDisplay.classList.toggle('placeholder', !expression);
    if (!expression) resultDisplay.textContent = '0';
    else if (window.math) {
      try {
        resultDisplay.textContent = formatNumber(evaluate(expression));
      } catch {
        resultDisplay.textContent = ' ';
      }
    }
  }

  function evaluate(source) {
    const toRadians = angleUnit === 'DEG' ? Math.PI / 180 : 1;
    const fromRadians = angleUnit === 'DEG' ? 180 / Math.PI : 1;
    const scope = {
      pi: Math.PI,
      e: Math.E,
      Ans: answer,
      sin: value => Math.sin(value * toRadians),
      cos: value => Math.cos(value * toRadians),
      tan: value => Math.tan(value * toRadians),
      asin: value => Math.asin(value) * fromRadians,
      acos: value => Math.acos(value) * fromRadians,
      atan: value => Math.atan(value) * fromRadians,
      log: value => Math.log10(value),
      ln: value => Math.log(value),
      sqrt: value => Math.sqrt(value),
      abs: value => Math.abs(value),
      factorial: value => math.factorial(value)
    };
    const value = math.evaluate(source, scope);
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid result');
    return value;
  }

  function showError() {
    resultDisplay.textContent = 'Math error';
    resultDisplay.classList.remove('placeholder');
    resultDisplay.classList.add('error');
  }

  function addHistory(source, value) {
    history.unshift({ source, value: formatNumber(value) });
    history.splice(8);
    historyList.replaceChildren();
    for (const item of history) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'history-item';
      button.setAttribute('aria-label', `${item.source} equals ${item.value}; reuse calculation`);
      const sourceLine = document.createElement('span');
      sourceLine.className = 'history-expression';
      sourceLine.textContent = item.source;
      const resultLine = document.createElement('span');
      resultLine.className = 'history-result';
      resultLine.textContent = `= ${item.value}`;
      button.append(sourceLine, resultLine);
      button.addEventListener('click', () => {
        expression = item.source;
        justCalculated = false;
        render();
      });
      historyList.append(button);
    }
  }

  function calculate() {
    if (!expression) return;
    try {
      const source = expression;
      const value = evaluate(source);
      answer = value;
      resultDisplay.textContent = formatNumber(value);
      resultDisplay.classList.remove('placeholder', 'error');
      expression = String(value);
      expressionDisplay.textContent = `${source} =`;
      justCalculated = true;
      addHistory(source, value);
    } catch {
      showError();
    }
  }

  function insert(value) {
    if (justCalculated && /[0-9.]/.test(value[0])) expression = '';
    justCalculated = false;
    if (value === '^2') expression += '^2';
    else if (value === '^0.5') expression += '^0.5';
    else expression += value;
    render();
  }

  function clear() {
    expression = '';
    justCalculated = false;
    render();
  }

  function backspace() {
    expression = expression.replace(/(?:asin|acos|atan|sin|cos|tan|sqrt|log|ln)\($/, '').slice(0, -1);
    justCalculated = false;
    render();
  }

  function toggleSign() {
    expression = `(-1)*(${expression || '0'})`;
    justCalculated = false;
    render();
  }

  keyGrid.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.insert !== undefined) insert(button.dataset.insert);
    else if (button.dataset.action === 'equals') calculate();
    else if (button.dataset.action === 'clear') clear();
    else if (button.dataset.action === 'backspace') backspace();
    else if (button.dataset.action === 'sign') toggleSign();
  });

  document.querySelectorAll('[data-angle]').forEach(button => {
    button.addEventListener('click', () => {
      angleUnit = button.dataset.angle;
      document.querySelectorAll('[data-angle]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
      render();
    });
  });

  document.getElementById('clear-history').addEventListener('click', () => {
    history.length = 0;
    historyList.innerHTML = '<p class="history-empty">Your calculations<br>will appear here.</p>';
  });

  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^[0-9.]$/.test(event.key)) insert(event.key);
    else if (['+', '-', '*', '/', '^', '(', ')', '%', '!'].includes(event.key)) insert(event.key);
    else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); calculate(); }
    else if (event.key === 'Backspace') backspace();
    else if (event.key === 'Escape') clear();
    else if (event.key.toLowerCase() === 'p') insert('pi');
  });

  render();
})();
