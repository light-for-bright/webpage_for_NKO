import { chartCalibration, measurementToPoint, metricCalibrations } from './chart-calibration.js';

const STORAGE_KEY = 'growthChartUserData';

export const inputRanges = {
  age: { min: 0, max: 48 },
  height: { min: 30, max: 120 },
  weight: { min: 1, max: 30 },
  headCircumference: { min: 25, max: 70 }
};

export const tableAges = Array.from({ length: 49 }, (_, index) => index);

const metricOrder = ['height', 'weight', 'headCircumference'];

function parseInputNumber(value) {
  const normalized = String(value).trim().replace(',', '.');

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatStoredValue(value) {
  return value === null || value === undefined ? '' : String(value).replace('.', ',');
}

function getWarningElement(input) {
  return input.closest('.input-cell')?.querySelector('.cell-warning') ?? null;
}

function setInputWarning(input, message) {
  const warning = getWarningElement(input);
  input.classList.toggle('is-invalid', Boolean(message));
  input.setCustomValidity(message);

  if (warning) {
    warning.textContent = message;
    warning.classList.toggle('is-visible', Boolean(message));
  }
}

function validateInput(input) {
  const metric = input.dataset.metric;
  const age = Number(input.dataset.age);
  const value = parseInputNumber(input.value);

  if (value === null) {
    setInputWarning(input, '');
    return null;
  }

  if (Number.isNaN(value)) {
    setInputWarning(input, 'Введите число');
    return null;
  }

  const range = inputRanges[metric];

  if (value < range.min || value > range.max) {
    setInputWarning(input, `Значение вне допустимого диапазона ${range.min}-${range.max} ${metricCalibrations[metric].unit}`);
    return null;
  }

  const point = measurementToPoint(metric, age, value);

  if (!point) {
    const chartRange = chartCalibration[metric];
    setInputWarning(input, `Значение вне диапазона графика ${chartRange.min}-${chartRange.max} ${metricCalibrations[metric].unit}`);
    return null;
  }

  setInputWarning(input, '');
  return point;
}

function rowTemplate(age, savedRow) {
  return `
    <tr>
      <td>${age}</td>
      ${metricOrder.map(metric => `
        <td class="input-cell">
          <input
            type="text"
            inputmode="decimal"
            data-age="${age}"
            data-metric="${metric}"
            aria-label="${metricCalibrations[metric].label} в ${age} месяцев"
            value="${formatStoredValue(savedRow?.[metric])}"
          />
          <span class="cell-warning" aria-live="polite"></span>
        </td>
      `).join('')}
    </tr>
  `;
}

export function loadSavedData() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (!savedData) {
    return [];
  }

  try {
    const parsed = JSON.parse(savedData);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(row => {
        const age = Number(row.age);

        if (!Number.isInteger(age) || age < inputRanges.age.min || age > inputRanges.age.max) {
          return null;
        }

        const normalizedRow = { age };

        for (const metric of metricOrder) {
          const value = Number(row[metric]);

          if (Number.isFinite(value)) {
            normalizedRow[metric] = value;
          }
        }

        return normalizedRow;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function saveUserData(data) {
  if (!data.length) {
    clearSavedData();
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearSavedData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function collectTableData(tableBody) {
  return tableAges
    .map(age => {
      const row = { age };

      for (const metric of metricOrder) {
        const input = tableBody.querySelector(`input[data-age="${age}"][data-metric="${metric}"]`);
        const value = parseInputNumber(input?.value ?? '');

        if (value !== null && !Number.isNaN(value)) {
          row[metric] = value;
        }
      }

      return row;
    })
    .filter(row => metricOrder.some(metric => row[metric] !== undefined));
}

export function collectUserSeries(tableBody) {
  const userSeries = {
    height: [],
    weight: [],
    headCircumference: []
  };

  tableBody.querySelectorAll('input[data-metric]').forEach(input => {
    const point = validateInput(input);

    if (point) {
      userSeries[input.dataset.metric].push(point);
    }
  });

  for (const metric of metricOrder) {
    userSeries[metric].sort((a, b) => a.age - b.age);
  }

  return userSeries;
}

export function buildUserTable(tableBody, savedData, onChange) {
  const savedByAge = new Map(savedData.map(row => [Number(row.age), row]));
  tableBody.innerHTML = tableAges.map(age => rowTemplate(age, savedByAge.get(age))).join('');

  tableBody.addEventListener('input', () => {
    onChange();
    saveUserData(collectTableData(tableBody));
  });
}

export function clearUserTable(tableBody) {
  tableBody.querySelectorAll('input').forEach(input => {
    input.value = '';
    setInputWarning(input, '');
  });
  clearSavedData();
}

export function fillReferenceData(tableBody, referenceCurves) {
  for (const metric of metricOrder) {
    for (const point of referenceCurves[metric] ?? []) {
      const input = tableBody.querySelector(`input[data-age="${point.age}"][data-metric="${metric}"]`);

      if (input) {
        input.value = String(point[metric]).replace('.', ',');
        setInputWarning(input, '');
      }
    }
  }

  saveUserData(collectTableData(tableBody));
}
