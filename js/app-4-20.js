import { setupPrintButton } from './export-print.js';
import { metricCalibrations } from './chart-calibration-4-20.js?v=3';
import { greyReferenceCurves } from './reference-curves-4-20.js';
import {
  buildUserTable,
  clearUserTable,
  collectUserSeries,
  fillReferenceData,
  loadSavedData
} from './user-data-4-20.js';

const userLayer = document.getElementById('userLayer');
const userRows = document.getElementById('userRows');
const clearDataBtn = document.getElementById('clearDataBtn');
const fillTestDataBtn = document.getElementById('fillTestDataBtn');
const printPageBtn = document.getElementById('printPageBtn');

function makeSvgElement(name, attrs) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);

  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }

  return element;
}

function drawSeries(metric, points) {
  if (!points.length) {
    return;
  }

  if (points.length >= 2) {
    userLayer.appendChild(makeSvgElement('polyline', {
      class: `user-line ${metric}`,
      points: points.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')
    }));
  }

  for (const point of points) {
    userLayer.appendChild(makeSvgElement('circle', {
      class: `user-point ${metric}`,
      cx: point.x.toFixed(2),
      cy: point.y.toFixed(2),
      r: 3.8
    }));
  }
}

function redrawUserPlot() {
  const userSeries = collectUserSeries(userRows);
  userLayer.innerHTML = '';

  for (const metric of Object.keys(metricCalibrations)) {
    drawSeries(metric, userSeries[metric]);
  }
}

buildUserTable(userRows, loadSavedData(), redrawUserPlot);
redrawUserPlot();

clearDataBtn.addEventListener('click', () => {
  clearUserTable(userRows);
  redrawUserPlot();
});

fillTestDataBtn.addEventListener('click', () => {
  fillReferenceData(userRows, greyReferenceCurves);
  redrawUserPlot();
});

setupPrintButton(printPageBtn);
