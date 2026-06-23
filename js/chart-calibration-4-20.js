export const chartCalibration = {
  age: {
    min: 4,
    max: 20,
    xMin: 43,
    xMax: 653,
    points: [
      { x: 43, value: 4 },
      { x: 80, value: 5 },
      { x: 119, value: 6 },
      { x: 157, value: 7 },
      { x: 195, value: 8 },
      { x: 233, value: 9 },
      { x: 271, value: 10 },
      { x: 309, value: 11 },
      { x: 348, value: 12 },
      { x: 386, value: 13 },
      { x: 424, value: 14 },
      { x: 462, value: 15 },
      { x: 500, value: 16 },
      { x: 538, value: 17 },
      { x: 577, value: 18 },
      { x: 615, value: 19 },
      { x: 653, value: 20 }
    ]
  },

  height: {
    min: 80,
    max: 160,
    yMin: 531,
    yMax: 163,
    points: [
      { y: 163, value: 150 },
      { y: 186, value: 145 },
      { y: 209, value: 140 },
      { y: 232, value: 135 },
      { y: 255, value: 130 },
      { y: 278, value: 125 },
      { y: 301, value: 120 },
      { y: 325, value: 115 },
      { y: 348, value: 110 },
      { y: 372, value: 105 },
      { y: 394, value: 100 },
      { y: 418, value: 95 },
      { y: 441, value: 90 },
      { y: 462, value: 85 },
      { y: 485, value: 80 },
      { y: 508, value: 75 },
      { y: 531, value: 70 }
    ],
    extrapolateHigh: true
  },

  weight: {
    min: 5,
    max: 100,
    yMin: 927,
    yMax: 510,
    // y привязаны к линиям сетки PNG; подписи шкалы смещены на 5 кг вниз.
    points: [
      { y: 510, value: 95 },
      { y: 531, value: 85 },
      { y: 556, value: 75 },
      { y: 584, value: 65 },
      { y: 617, value: 55 },
      { y: 656, value: 45 },
      { y: 679, value: 35 },
      { y: 706, value: 30 },
      { y: 736, value: 25 },
      { y: 772, value: 20 },
      { y: 816, value: 15 },
      { y: 872, value: 10 },
      { y: 927, value: 5 }
    ],
    extrapolateHigh: true
  }
};

export const chartSize = {
  width: 703,
  height: 1024
};

function interpolateByValue(points, value) {
  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index];
    const next = points[index + 1];
    const min = Math.min(current.value, next.value);
    const max = Math.max(current.value, next.value);

    if (value >= min && value <= max) {
      const ratio = (value - current.value) / (next.value - current.value);
      return current.y + ratio * (next.y - current.y);
    }
  }

  return null;
}

function extrapolateHighByValue(points, value) {
  const sorted = [...points].sort((a, b) => b.value - a.value);
  const [highest, nextHighest] = sorted;
  const ratio = (value - highest.value) / (nextHighest.value - highest.value);
  return highest.y + ratio * (nextHighest.y - highest.y);
}

function valueToAxisPosition(value, axis) {
  if (value < axis.min || value > axis.max) {
    return null;
  }

  const interpolated = interpolateByValue(axis.points, value);

  if (interpolated !== null) {
    return interpolated;
  }

  if (axis.extrapolateHigh) {
    return extrapolateHighByValue(axis.points, value);
  }

  return null;
}

export function ageToX(ageInYears) {
  const axis = chartCalibration.age;

  if (ageInYears < axis.min || ageInYears > axis.max) {
    return null;
  }

  for (let index = 0; index < axis.points.length - 1; index++) {
    const current = axis.points[index];
    const next = axis.points[index + 1];

    if (ageInYears >= current.value && ageInYears <= next.value) {
      const ratio = (ageInYears - current.value) / (next.value - current.value);
      return current.x + ratio * (next.x - current.x);
    }
  }

  return null;
}

export function heightToY(heightCm) {
  return valueToAxisPosition(heightCm, chartCalibration.height);
}

export function weightToY(weightKg) {
  return valueToAxisPosition(weightKg, chartCalibration.weight);
}

export const metricCalibrations = {
  height: {
    label: 'Рост',
    unit: 'см',
    color: '#0a7f3a',
    valueToY: heightToY,
    calibration: chartCalibration.height
  },
  weight: {
    label: 'Вес',
    unit: 'кг',
    color: '#cc5a00',
    valueToY: weightToY,
    calibration: chartCalibration.weight
  }
};

export function measurementToPoint(metric, age, value) {
  const x = ageToX(age);
  const y = metricCalibrations[metric]?.valueToY(value) ?? null;

  if (x === null || y === null) {
    return null;
  }

  return { age, value, x, y };
}
