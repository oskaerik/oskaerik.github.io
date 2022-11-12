const $sheetImageUrl = document.getElementById('sheet-image-url');
const $newAttribute = document.getElementById('new-attribute');
const $copyHtml = document.getElementById('copy-html');
const $iframe = document.getElementById('iframe');
const $drag = document.getElementById('drag');
const $sheet = $iframe.contentDocument.getElementById('sheet');

const state = { imageUrl: null };

function saveState() {
  const queryString = new URLSearchParams(state).toString();
  if (window.location.search != `?${queryString}`)
    window.location.search = queryString;
}

function loadState() {
  const queryString = new URLSearchParams(window.location.search);
  for (const [key, value] of queryString) {
    if (key in state) state[key] = value;
  }
  console.log('Initial state:', state);

  $sheetImageUrl.value = getImageUrl();
  $sheetImageUrl.dispatchEvent(new Event('change'));
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

function endDrag() {
  $sheet.removeEventListener('mousedown', beginDrag);
  $sheet.removeEventListener('mouseup', endDrag);
  $sheet.removeEventListener('mousemove', drag);
  $sheet.style.cursor = 'initial';
  $drag.classList.toggle('hidden', true);
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

function copyHtml() {
  navigator.clipboard.writeText($sheet.outerHTML);
}

// Load initial state
loadState();

/* --- Development --- */
let s = '';
document.querySelectorAll('[id]').forEach((el) => {
  const { id } = el;
  const name = id.replace(/-(.)/g, (_, c) => c.toUpperCase());
  s += `const $${name} = document.getElementById('${id}')\n`;
});
console.log(s);
