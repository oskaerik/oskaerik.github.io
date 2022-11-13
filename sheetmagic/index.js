const PROP_TYPES = {
  num: {
    tag: 'input',
    type: 'number',
    classList: ['sm-prop', 'sm-num'],
  },
  slt: {
    tag: 'input',
    type: 'text',
    classList: ['sm-prop', 'sm-slt'],
  },
  mlt: {
    tag: 'textarea',
    type: null,
    classList: ['sm-prop', 'sm-mlt'],
  },
};

const $sheetImageUrl = document.getElementById('sheet-image-url');
const $propType = document.getElementById('prop-type');
const $addProp = document.getElementById('add-prop');
const $iframe = document.getElementById('iframe');
const $copyHtml = document.getElementById('copy-html');
const $drag = document.getElementById('drag');
const $sheet = $iframe.contentDocument.getElementsByClassName('sheetmagic')[0];

const state = { properties: [] };
const allowedKeys = new Set(['imageUrl', 'properties']);

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

  state.properties.forEach((prop) => {
    console.log('prop.type:', prop.type);
    console.log('PROP_TYPES[prop.type]:', PROP_TYPES[prop.type]);
    const { tag, type, classList } = PROP_TYPES[prop.type];
    if (!tag) return;
    const el = document.createElement(tag);
    el.type = type;
    el.classList = classList.join(' ');
    el.style = prop.style;
    console.log(prop.style);
    el.style.left = `${prop.x}px`;
    el.style.top = `${prop.y}px`;
    el.style.width = `${prop.w}px`;
    el.style.height = `${prop.h}px`;
    el.style.position = 'absolute';
    $sheet.appendChild(el);
    el.select();
    $propType.value = prop.type;
  });
}

function setImageUrl(imageUrl) {
  state.imageUrl = imageUrl;
  saveState();
}

function getImageUrl() {
  return state.imageUrl;
}

$sheetImageUrl.addEventListener('change', setSheetImage);
$addProp.addEventListener('click', initCreateProp);
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

function initCreateProp() {
  $sheet.addEventListener('mousedown', initDrag);
  $sheet.addEventListener('mouseup', endDrag);
  $sheet.style.cursor = 'crosshair';
}

const dragBox = { x1: null, y1: null, x2: null, y2: null };

function initDrag(ev) {
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
  const border = 2;
  const xMin = Math.min(dragBox.x1, dragBox.x2) + offsetX;
  const xMax = Math.max(dragBox.x1, dragBox.x2) + offsetX - 2 * border;
  const yMin = Math.min(dragBox.y1, dragBox.y2) + offsetY;
  const yMax = Math.max(dragBox.y1, dragBox.y2) + offsetY - 2 * border;
  $drag.style.left = `${xMin}px`;
  $drag.style.top = `${yMin}px`;
  $drag.style.width = `${xMax - xMin}px`;
  $drag.style.height = `${yMax - yMin}px`;
  $drag.classList.toggle('hidden', false);
}

function endDrag() {
  $sheet.removeEventListener('mousedown', initDrag);
  $sheet.removeEventListener('mouseup', endDrag);
  $sheet.removeEventListener('mousemove', drag);
  $sheet.style.cursor = 'initial';
  $drag.classList.toggle('hidden', true);
  createProp();
}

function createProp() {
  for (const value of Object.values(dragBox)) if (value === null) return;
  const xMin = Math.min(dragBox.x1, dragBox.x2);
  const xMax = Math.max(dragBox.x1, dragBox.x2);
  const yMin = Math.min(dragBox.y1, dragBox.y2);
  const yMax = Math.max(dragBox.y1, dragBox.y2);
  const x = xMin;
  const y = yMin;
  const w = xMax - xMin;
  const h = yMax - yMin;
  prop = {
    type: $propType.value,
    x: x,
    y: y,
    w: w,
    h: h,
  };
  if ($propType.value === 'num' || $propType.value === 'slt')
    prop.style = `font-size: ${Math.round(0.6 * h)}px;`;
  state.properties.push(prop);
  saveState();
}

function copyHtml() {
  navigator.clipboard.writeText($sheet.outerHTML);
}

// Set initial state
loadState();
const sheetStyle = document.createElement('style');
sheetStyle.innerHTML = `
.sheetmagic {
  position: relative;
  margin: auto;
}

.sheetmagic .sm-prop {
  position: absolute;
  background: transparent !important;
  box-shadow: none;
  border: none;
  color: black;
}

.sheetmagic .sm-prop:focus {
  background: rgba(0, 0, 0, 0.1) !important;
}

.sheetmagic .sm-mlt {
  font-size: 16px;
}

.sheetmagic .sm-num {
  text-align: center;
}

.sheetmagic .sm-roll {
  cursor: pointer;
}

.sheetmagic input::-webkit-outer-spin-button,
.sheetmagic input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.sheetmagic input[type='number'] {
  -moz-appearance: textfield;
}

.sheetmagic button[type='roll']::before {
  content: '' !important;
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
