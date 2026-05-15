export const chartCalibration = {
  age: {
    min: 0,
    max: 48,
    xMin: 66,
    xMax: 722,
    points: [
      { x: 66, value: 0 },
      { x: 138, value: 2 },
      { x: 198, value: 4 },
      { x: 249, value: 6 },
      { x: 294, value: 8 },
      { x: 333, value: 10 },
      { x: 369, value: 12 },
      { x: 416, value: 15 },
      { x: 462, value: 18 },
      { x: 508, value: 21 },
      { x: 554, value: 24 },
      { x: 600, value: 27 },
      { x: 630, value: 30 },
      { x: 657, value: 33 },
      { x: 681, value: 36 },
      { x: 700, value: 39 },
      { x: 710, value: 42 },
      { x: 717, value: 45 },
      { x: 721, value: 48 }
    ]
  },

  height: {
    min: 40,
    max: 120,
    yMin: 735,
    yMax: 300,
    points: [
      { y: 332, value: 90 },
      { y: 380, value: 80 },
      { y: 450, value: 70 },
      { y: 489, value: 65 },
      { y: 531, value: 60 },
      { y: 577, value: 55 },
      { y: 627, value: 50 },
      { y: 687, value: 45 },
      { y: 738, value: 40 }
    ],
    extrapolateHigh: true
  },

  weight: {
    min: 2,
    max: 20,
    yMin: 735,
    yMax: 500,
    points: [
      { y: 526, value: 20 },
      { y: 549, value: 18 },
      { y: 573, value: 16 },
      { y: 585, value: 15 },
      { y: 602, value: 14 },
      { y: 634, value: 12 },
      { y: 668, value: 10 },
      { y: 689, value: 9 },
      { y: 708, value: 8 },
      { y: 732, value: 7 },
      { y: 761, value: 6 },
      { y: 798, value: 5 },
      { y: 847, value: 4 },
      { y: 893, value: 3 },
      { y: 942, value: 2 }
    ]
  },

  headCircumference: {
    min: 30,
    max: 62,
    yMin: 225,
    yMax: 140,
    points: [
      { y: 139, value: 60 },
      { y: 183, value: 55 },
      { y: 226, value: 50 },
      { y: 278, value: 45 },
      { y: 333, value: 40 },
      { y: 396, value: 35 },
      { y: 469, value: 30 }
    ],
    extrapolateHigh: true
  }
};

export const chartSize = {
  width: 768,
  height: 1094
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

export function ageToX(ageInMonths) {
  const axis = chartCalibration.age;

  if (ageInMonths < axis.min || ageInMonths > axis.max) {
    return null;
  }

  for (let index = 0; index < axis.points.length - 1; index++) {
    const current = axis.points[index];
    const next = axis.points[index + 1];

    if (ageInMonths >= current.value && ageInMonths <= next.value) {
      const ratio = (ageInMonths - current.value) / (next.value - current.value);
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

export function headCircumferenceToY(headCircumferenceCm) {
  return valueToAxisPosition(headCircumferenceCm, chartCalibration.headCircumference);
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
  },
  headCircumference: {
    label: 'Окружность головы',
    unit: 'см',
    color: '#2458d3',
    valueToY: headCircumferenceToY,
    calibration: chartCalibration.headCircumference
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
