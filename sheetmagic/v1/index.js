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
  roll: {
    tag: 'button',
    type: 'roll',
    classList: ['sm-prop', 'sm-roll'],
  },
};

const $iframe = document.getElementById('iframe');
const $sidebar = document.getElementById('sidebar');
const $sidebarFieldCopy = document.getElementById('sidebar-field-copy');
const $copyHtml = document.getElementById('copy-html');
const $copyCss = document.getElementById('copy-css');
const $sheetImageUrl = document.getElementById('sheet-image-url');
const $sidebarFieldAddProp = document.getElementById('sidebar-field-add-prop');
const $addProp = document.getElementById('add-prop');
const $addPropInfo = document.getElementById('add-prop-info');
const $template = document.getElementById('template');
const $drag = document.getElementById('drag');
let $sheet = null;
let $sheetStyle = null;

// Set srcdoc and init when loaded
window.addEventListener('message', (e) => {
  if (e.data === 'loaded') init();
});
$iframe.srcdoc =
  "<html><head></head><body style='margin: 0;'><div class='sheetmagic'></div><script>window.parent.postMessage('loaded', '*');</script></body></html>";

const state = { properties: [] };
const allowedKeys = new Set(['imageUrl', 'properties']);

function init() {
  $sheet = $iframe.contentDocument.getElementsByClassName('sheetmagic')[0];
  $sheetStyle = document.createElement('style');
  $iframe.contentDocument
    .getElementsByTagName('head')[0]
    .appendChild($sheetStyle);
  $sheetStyle.innerHTML = `\
.sheetmagic {
  position: relative;
  margin: auto;
}

.sm-prop {
  position: absolute;
  background: transparent !important;
  box-shadow: none;
  border: none;
  color: black;
}

.sm-prop:focus {
  background: rgba(0, 0, 0, 0.1) !important;
}

.sm-mlt {
  font-size: 16px;
}

.sm-num {
  text-align: center;
}

.sm-roll {
  cursor: pointer;
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
`;
  loadState();
}

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

  $sheet.setAttribute('data-sheetmagic-url', window.location.href);

  $sheetImageUrl.value = getImageUrl() || '';
  $sheetImageUrl.dispatchEvent(new Event('change'));

  state.properties.forEach((prop) => {
    const sidebarField = $template.content.firstElementChild.cloneNode(true);

    const propDelete = [].filter.call(
      sidebarField.getElementsByTagName('button'),
      (el) => el.name === 'prop-delete'
    )[0];
    propDelete.addEventListener('click', () => {
      state.properties = state.properties.filter((el) => el.id !== prop.id);
      saveState();
    });

    const propHighlight = [].filter.call(
      sidebarField.getElementsByTagName('button'),
      (el) => el.name === 'prop-highlight'
    )[0];
    propHighlight.addEventListener('click', () => {
      const el = [].filter.call(
        $sheet.getElementsByTagName('*'),
        (el) => parseInt(el.getAttribute('data-sm-id')) === prop.id
      )[0];
      el.focus();
    });

    const propType = [].filter.call(
      sidebarField.getElementsByTagName('select'),
      (el) => el.name === 'prop-type'
    )[0];
    propType.value = prop.type;
    propType.addEventListener('change', () => {
      prop.type = propType.value;
      saveState();
    });

    const propName = [].filter.call(
      sidebarField.getElementsByTagName('input'),
      (el) => el.name === 'prop-name'
    )[0];
    propName.value = prop.name || '';
    propName.addEventListener('change', () => {
      prop.name = propName.value.toLowerCase().replace(/[^a-z]/g, '');
      propName.value = prop.name;
      saveState();
    });

    const propValue = [].filter.call(
      sidebarField.getElementsByTagName('input'),
      (el) => el.name === 'prop-value'
    )[0];
    if (prop.type === 'roll') propValue.hidden = false;
    propValue.value = prop.value || '';
    propValue.addEventListener('change', () => {
      prop.value = propValue.value;
      saveState();
    });

    const propJson = sidebarField.getElementsByTagName('code')[0];
    propJson.textContent = JSON.stringify(prop);

    $sidebar.append(sidebarField);

    const { tag, type, classList } = PROP_TYPES[prop.type];
    const el = document.createElement(tag);
    if (prop.type === 'roll') {
      el.name = `roll_${propName.value}`;
      el.value = propValue.value;
    } else {
      el.name = `attr_${propName.value}`;
    }
    el.setAttribute('data-sm-id', prop.id);
    el.type = type;
    el.classList = classList.join(' ');
    el.style.left = `${prop.x}px`;
    el.style.top = `${prop.y}px`;
    el.style.width = `${prop.w}px`;
    el.style.height = `${prop.h}px`;
    el.style.position = 'absolute';
    if (prop.type === 'num' || prop.type === 'slt')
      el.style.fontSize = `${Math.round(0.6 * prop.h)}px`;
    $sheet.appendChild(el);
    el.focus();
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
$copyCss.addEventListener('click', copyCss);

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
      const padding = '20px';
      $sidebar.style.maxWidth = `calc(100% - ${$sheet.style.width} - ${padding})`;
      $sheetImageUrl.disabled = true;
      $sidebarFieldCopy.hidden = false;
      $sidebarFieldAddProp.hidden = false;
    };
    image.src = this.result;
  };
  reader.readAsDataURL(blob);
}

function initCreateProp() {
  $sheet.addEventListener('mousedown', initDrag);
  $sheet.addEventListener('mouseup', endDrag);
  $sheet.style.cursor = 'crosshair';
  $addPropInfo.hidden = false;
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
  $drag.hidden = false;
}

function endDrag() {
  $sheet.removeEventListener('mousedown', initDrag);
  $sheet.removeEventListener('mouseup', endDrag);
  $sheet.removeEventListener('mousemove', drag);
  $sheet.style.cursor = 'initial';
  $drag.hidden = true;
  $addPropInfo.hidden = true;
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
    type: 'slt',
    name: null,
    value: null,
    x: x,
    y: y,
    w: w,
    h: h,
    id: state.properties.length
      ? state.properties[state.properties.length - 1].id + 1
      : 0,
  };
  state.properties.push(prop);
  saveState();
}

function copyHtml() {
  navigator.clipboard.writeText($sheet.outerHTML);
}

function copyCss() {
  navigator.clipboard.writeText($sheetStyle.innerHTML);
}