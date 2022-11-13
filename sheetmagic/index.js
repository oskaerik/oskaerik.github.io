const $sheetImageUrl = document.getElementById('sheet-image-url');
const $newAttribute = document.getElementById('new-attribute');
const $copyHtml = document.getElementById('copy-html');
const $iframe = document.getElementById('iframe');
const $drag = document.getElementById('drag');
const $sheet = $iframe.contentDocument.getElementsByClassName('sheet')[0];

const state = {};
const allowedKeys = new Set(['imageUrl']);

function saveState() {
  const queryString = new URLSearchParams({
    json: JSON.stringify(state),
  }).toString();
  if (window.location.search !== `?${queryString}`)
    window.location.search = queryString;
}

function loadState() {
  const queryString = new URLSearchParams(window.location.search);
  json = JSON.parse(queryString.get('json'));
  if (!json) return;
  for (const key in json) if (allowedKeys.has(key)) state[key] = json[key];
  console.log('Loaded state from JSON:', state);

  $sheetImageUrl.value = getImageUrl() || '';
  $sheetImageUrl.dispatchEvent(new Event('change'));

  if (!('x1' in state)) return;
  const el = document.createElement('input');
  el.classList.add('property', 'num');
  el.type = 'number';
  el.style.left = `${state.x1}px`;
  el.style.top = `${state.y1}px`;
  el.style.width = `${state.w1}px`;
  el.style.height = `${state.h1}px`;
  el.style.position = 'absolute';
  $sheet.appendChild(el);
  el.select();
}

function setImageUrl(imageUrl) {
  state.imageUrl = imageUrl;
  saveState();
}

function getImageUrl() {
  return state.imageUrl;
}

$sheetImageUrl.addEventListener('change', setSheetImage);
$newAttribute.addEventListener('click', beginNewAttribute);
$copyHtml.addEventListener('click', copyHtml);

async function setSheetImage() {
  const imageUrl = $sheetImageUrl.value;
  if (!imageUrl) return;
  setImageUrl(imageUrl);
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const reader = new FileReader();
  reader.onload = function () {
    const image = new Image();
    image.onload = function () {
      $iframe.width = this.naturalWidth;
      $iframe.height = this.naturalHeight;
      $sheet.style.width = `${this.naturalWidth}px`;
      $sheet.style.height = `${this.naturalHeight}px`;
      $sheet.style.backgroundImage = `url(${imageUrl})`;
    };
    image.src = this.result;
  };
  reader.readAsDataURL(blob);
}

function beginNewAttribute() {
  $sheet.addEventListener('mousedown', beginDrag);
  $sheet.addEventListener('mouseup', endDrag);
  $sheet.style.cursor = 'crosshair';
}

const dragBox = { x1: null, y1: null, x2: null, y2: null };

function beginDrag(ev) {
  $sheet.addEventListener('mousemove', drag);
  dragBox.x1 = ev.clientX;
  dragBox.y1 = ev.clientY;
}

function drag(ev) {
  dragBox.x2 = ev.clientX;
  dragBox.y2 = ev.clientY;
  const iframeRect = $iframe.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const offsetX = iframeRect.left - bodyRect.left;
  const offsetY = iframeRect.top - bodyRect.top;
  const xMin = Math.min(dragBox.x1, dragBox.x2) + offsetX;
  const xMax = Math.max(dragBox.x1, dragBox.x2) + offsetX;
  const yMin = Math.min(dragBox.y1, dragBox.y2) + offsetY;
  const yMax = Math.max(dragBox.y1, dragBox.y2) + offsetY;
  $drag.style.left = `${xMin}px`;
  $drag.style.top = `${yMin}px`;
  $drag.style.width = `${xMax - xMin}px`;
  $drag.style.height = `${yMax - yMin}px`;
  $drag.classList.toggle('hidden', false);
}

function endDrag() {
  $sheet.removeEventListener('mousedown', beginDrag);
  $sheet.removeEventListener('mouseup', endDrag);
  $sheet.removeEventListener('mousemove', drag);
  $sheet.style.cursor = 'initial';
  $drag.classList.toggle('hidden', true);
  createProperty();
}

function createProperty() {
  for (const value of Object.values(dragBox)) if (value === null) return;
  const xMin = Math.min(dragBox.x1, dragBox.x2);
  const xMax = Math.max(dragBox.x1, dragBox.x2);
  const yMin = Math.min(dragBox.y1, dragBox.y2);
  const yMax = Math.max(dragBox.y1, dragBox.y2);
  state.x1 = xMin;
  state.y1 = yMin;
  state.w1 = xMax - xMin;
  state.h1 = yMax - yMin;
  saveState();
}

function copyHtml() {
  navigator.clipboard.writeText($sheet.outerHTML);
}

// Set initial state
loadState();
const sheetStyle = document.createElement('style');
sheetStyle.innerHTML = `
.sheet {
  position: relative;
  margin: auto;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
}

button[type='roll']::before {
  content: '' !important;
}

.property {
  position: absolute;
  background: transparent !important;
  box-shadow: none;
  border: none;
  color: black;
}

.num {
  text-align: center;
}

.roll {
  cursor: pointer;
}
`;
$iframe.contentDocument.getElementsByTagName('head')[0].appendChild(sheetStyle);

/* --- Development --- */
let s = '';
document.querySelectorAll('[id]').forEach((el) => {
  const { id } = el;
  const name = id.replace(/-(.)/g, (_, c) => c.toUpperCase());
  s += `const $${name} = document.getElementById('${id}')\n`;
});
console.log(s);
