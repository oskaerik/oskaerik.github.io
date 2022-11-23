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
  checkbox: {
    tag: 'input',
    type: 'checkbox',
    classList: ['sm-prop', 'sm-checkbox'],
  },
  autocalc: {
    tag: 'input',
    type: 'number',
    classList: ['sm-prop', 'sm-num'],
  },
  noedit: {
    tag: 'span',
    type: null,
    classList: ['sm-prop', 'sm-noedit'],
  },
};

const $iframe = document.getElementById('iframe');
const $sidebar = document.getElementById('sidebar');
const $sidebarFieldCopy = document.getElementById('sidebar-field-copy');
const $copyHtml = document.getElementById('copy-html');
const $copyCss = document.getElementById('copy-css');
const $sheetImageUrl = document.getElementById('sheet-image-url');
const $sidebarFieldAddProp = document.getElementById('sidebar-field-add-prop');
const $colorPicker = document.getElementById('color-picker');
const $addProp = document.getElementById('add-prop');
const $hotkeysInfo = document.getElementById('hotkeys-info');
const $addPropInfo = document.getElementById('add-prop-info');
const $copyPropInfo = document.getElementById('copy-prop-info');
const $sidebarFieldCopyDelete = document.getElementById(
  'sidebar-field-copy-delete'
);
const $copySelected = document.getElementById('copy-selected');
const $renameSelected = document.getElementById('rename-selected');
const $deleteSelected = document.getElementById('delete-selected');
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
const allowedKeys = new Set(['imageUrl', 'properties', 'fontColor']);

function init() {
  $sheet = $iframe.contentDocument.getElementsByClassName('sheetmagic')[0];
  $iframe.contentDocument.addEventListener('keydown', (ev) => {
    if (ev.key === 'A') $addProp.click();
  });
  $sheetStyle = document.createElement('style');
  $iframe.contentDocument
    .getElementsByTagName('head')[0]
    .appendChild($sheetStyle);
  $colorPicker.addEventListener('change', () => {
    state.fontColor = $colorPicker.value;
    saveState();
  });
  loadState();
  countVisit();
}

function saveState() {
  const hash = encodeURIComponent(JSON.stringify(state));
  if (window.location.hash !== `#${hash}`) {
    window.location.hash = hash;
    location.reload();
    return true;
  }
  return false;
}

function loadState() {
  const hash = window.location.hash.substring(1);
  if (!hash) return;
  json = JSON.parse(decodeURIComponent(hash));
  if (!json) return;
  for (const key in json) if (allowedKeys.has(key)) state[key] = json[key];
  console.log('Loaded state from JSON:', state);

  $sheetImageUrl.value = state.imageUrl || '';
  $sheetImageUrl.dispatchEvent(new Event('change'));

  state.properties.forEach((prop) => {
    const sidebarField = $template.content.firstElementChild.cloneNode(true);

    const propSelect = [].filter.call(
      sidebarField.getElementsByTagName('input'),
      (el) => el.name === 'prop-select'
    )[0];
    propSelect.setAttribute('data-sm-id', prop.id);

    const propType = [].filter.call(
      sidebarField.getElementsByTagName('select'),
      (el) => el.name === 'prop-type'
    )[0];
    propType.value = prop.type;
    propType.addEventListener('change', () => {
      prop.type = propType.value;
      prop.value = null;
      saveState();
    });

    const propName = [].filter.call(
      sidebarField.getElementsByTagName('input'),
      (el) => el.name === 'prop-name'
    )[0];
    if (prop.type !== 'noedit') propName.hidden = false;
    propName.value = prop.name || '';
    propName.addEventListener('change', () => {
      prop.name = propName.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      propName.value = prop.name;
      saveState();
    });

    const propValue = [].filter.call(
      sidebarField.getElementsByTagName('input'),
      (el) => el.name === 'prop-value'
    )[0];
    let placeholder = null;
    switch (prop.type) {
      case 'roll':
        placeholder = 'Example: /roll 1d20 + @{strength}';
        break;
      case 'autocalc':
        placeholder = 'Example: (floor(@{strength} / 2))';
        break;
      case 'noedit':
        placeholder = 'Any text can be written here';
        break;
      default:
        break;
    }
    if (placeholder !== null) {
      propValue.placeholder = placeholder;
      propValue.hidden = false;
    }
    propValue.value = prop.value || '';
    propValue.addEventListener('change', () => {
      prop.value = propValue.value;
      saveState();
    });

    const propMoveDown = [].filter.call(
      sidebarField.getElementsByTagName('button'),
      (el) => el.name === 'prop-move-down'
    )[0];
    propMoveDown.addEventListener('click', () => {
      const ind = state.properties.findIndex((x) => x.id === prop.id);
      if (ind !== -1 && ind < state.properties.length - 1) {
        state.properties[ind] = state.properties[ind + 1];
        state.properties[ind + 1] = prop;
      }
      saveState();
    });

    const propMoveUp = [].filter.call(
      sidebarField.getElementsByTagName('button'),
      (el) => el.name === 'prop-move-up'
    )[0];
    propMoveUp.addEventListener('click', () => {
      const ind = state.properties.findIndex((x) => x.id === prop.id);
      if (ind > 0) {
        state.properties[ind] = state.properties[ind - 1];
        state.properties[ind - 1] = prop;
      }
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

    const propJson = sidebarField.getElementsByTagName('code')[0];
    propJson.textContent = JSON.stringify(prop);

    $sidebar.append(sidebarField);

    const { tag, type, classList } = PROP_TYPES[prop.type];
    const el = document.createElement(tag);
    switch (prop.type) {
      case 'roll':
        el.name = `roll_${propName.value}`;
        el.value = propValue.value;
        break;
      case 'autocalc':
        el.name = `attr_${propName.value}`;
        el.setAttribute('value', propValue.value);
        el.setAttribute('disabled', 'true');
        break;
      case 'noedit':
        el.textContent = propValue.value;
        break;
      case 'checkbox':
        el.name = `attr_${propName.value}`;
        el.value = '1';
        break;
      default:
        el.name = `attr_${propName.value}`;
        break;
    }
    el.setAttribute('data-sm-id', prop.id);
    el.type = type;
    el.classList = classList.join(' ');
    el.style.left = `${prop.x}px`;
    el.style.top = `${prop.y}px`;
    el.style.width = `${prop.w}px`;
    el.style.height = `${prop.h}px`;
    if (prop.type === 'num' || prop.type === 'slt')
      el.style.fontSize = `${Math.round(0.6 * prop.h)}px`;
    else if (prop.type === 'noedit') el.style.fontSize = `${prop.h}px`;
    $sheet.appendChild(el);
    el.focus();
  });
  $colorPicker.value = state.fontColor || '#000000';
  updateSheetStyle();
}

$sheetImageUrl.addEventListener('change', setSheetImage);
$copyHtml.addEventListener('click', copyHtml);
$copyCss.addEventListener('click', copyCss);

$addProp.addEventListener('click', () => {
  $hotkeysInfo.hidden = true;
  $addPropInfo.hidden = false;
  $copyPropInfo.hidden = true;
  $addProp.disabled = true;
  $copySelected.disabled = true;
  $renameSelected.disabled = true;
  $deleteSelected.disabled = true;
  initCreateProp(initDrag, () => {
    endDrag();
    createProp();
  });
});

$copySelected.addEventListener('click', () => {
  const checkboxes = [].filter.call(
    $sidebar.getElementsByTagName('input'),
    (el) => el.name === 'prop-select' && el.checked
  );
  const selectedProps = checkboxes.map(
    (checkbox) =>
      state.properties.filter(
        (prop) => prop.id === parseInt(checkbox.getAttribute('data-sm-id'))
      )[0]
  );
  if (!selectedProps.length) return;
  $hotkeysInfo.hidden = true;
  $addPropInfo.hidden = true;
  $copyPropInfo.hidden = false;
  $addProp.disabled = true;
  $copySelected.disabled = true;
  $renameSelected.disabled = true;
  $deleteSelected.disabled = true;
  initCreateProp((ev) => {
    const xDiff = ev.clientX - selectedProps[0].x;
    const yDiff = ev.clientY - selectedProps[0].y;
    copyProperties(selectedProps, xDiff, yDiff);
  }, endDrag);
});

$renameSelected.addEventListener('click', () => {
  const checkboxes = [].filter.call(
    $sidebar.getElementsByTagName('input'),
    (el) => el.name === 'prop-select' && el.checked
  );
  const selectedProps = checkboxes.map(
    (checkbox) =>
      state.properties.filter(
        (prop) => prop.id === parseInt(checkbox.getAttribute('data-sm-id'))
      )[0]
  );
  if (!selectedProps.length) return;
  const newName = prompt(
    `Renaming ${selectedProps.length} properties, they will be renamed to: name1, name2, ...\nEnter new name:`,
    'renamed'
  );
  if (newName == null || newName == '') return;
  selectedProps.forEach((prop, ind) => (prop.name = `${newName}${ind + 1}`));
  saveState();
});

$deleteSelected.addEventListener('click', () => {
  const checkboxes = [].filter.call(
    $sidebar.getElementsByTagName('input'),
    (el) => el.name === 'prop-select' && el.checked
  );
  const selectedIds = new Set(
    checkboxes.map((checkbox) => parseInt(checkbox.getAttribute('data-sm-id')))
  );
  state.properties = state.properties.filter(
    (prop) => !selectedIds.has(prop.id)
  );
  saveState();
});

async function setSheetImage() {
  const imageUrl = $sheetImageUrl.value;
  if (!imageUrl) return;
  state.imageUrl = imageUrl;
  const reloading = saveState();
  if (reloading) return;

  let response = null;
  try {
    response = await fetch(imageUrl);
  } catch (e) {
    alert(
      `Failed to get image: ${imageUrl}\n\nRefresh the page, otherwise try uploading it to e.g. https://imgbb.com/ instead.`
    );
    return;
  }
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
      $sidebarFieldCopyDelete.hidden = false;
    };
    image.src = this.result;
  };
  reader.readAsDataURL(blob);
}

function initCreateProp(onMouseDown, onMouseUp) {
  $sheet.addEventListener('mousedown', onMouseDown);
  $sheet.addEventListener('mouseup', onMouseUp);
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
  const [offsetX, offsetY] = getOffsets();
  const xMin = Math.min(dragBox.x1, dragBox.x2) + offsetX;
  const xMax = Math.max(dragBox.x1, dragBox.x2) + offsetX;
  const yMin = Math.min(dragBox.y1, dragBox.y2) + offsetY;
  const yMax = Math.max(dragBox.y1, dragBox.y2) + offsetY;
  $drag.style.left = `${xMin}px`;
  $drag.style.top = `${yMin}px`;
  $drag.style.width = `${xMax - xMin}px`;
  $drag.style.height = `${yMax - yMin}px`;
  $drag.hidden = false;
}

const getOffsets = () => {
  const iframeRect = $iframe.getBoundingClientRect();
  const bodyRect = document.body.getBoundingClientRect();
  const offsetX = iframeRect.left - bodyRect.left;
  const offsetY = iframeRect.top - bodyRect.top;
  return [offsetX, offsetY];
};

function endDrag() {
  $sheet.removeEventListener('mousedown', initDrag);
  $sheet.removeEventListener('mouseup', endDrag);
  $sheet.removeEventListener('mousemove', drag);
  $sheet.style.cursor = 'initial';
  $drag.hidden = true;
  $hotkeysInfo.hidden = false;
  $addPropInfo.hidden = true;
  $copyPropInfo.hidden = true;
  $addProp.disabled = false;
  $copySelected.disabled = false;
  $renameSelected.disabled = false;
  $deleteSelected.disabled = false;
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
  const id = getNextId();
  prop = {
    type: 'slt',
    name: `prop${id}`,
    value: null,
    x: x,
    y: y,
    w: w,
    h: h,
    id: id,
  };
  state.properties.push(prop);
  saveState();
}

function copyProperties(selectedProps, xDiff, yDiff) {
  selectedProps.forEach((prop) => {
    const id = getNextId();
    const clone = {
      ...prop,
      name: `prop${id}`,
      x: prop.x + xDiff,
      y: prop.y + yDiff,
      id: id,
    };
    state.properties.push(clone);
  });
  saveState();
}

function getNextId() {
  return state.properties.length
    ? state.properties.reduce((max, curr) => (max.id > curr.id ? max : curr))
        .id + 1
    : 1;
}

function copyHtml() {
  alert('HTML copied to clipboard');
  return navigator.clipboard.writeText($sheet.outerHTML);
}

function copyCss() {
  alert('CSS copied to clipboard');
  return navigator.clipboard.writeText($sheetStyle.innerHTML);
}

function updateSheetStyle() {
  $sheetStyle.innerHTML = `\
.sheetmagic {
  position: relative;
  margin: auto;
  font-family: sans-serif;
}

.sheetmagic * {
  color: ${state.fontColor || $colorPicker.value} !important;
}

.sm-prop {
  margin: 0 !important;
  padding: 0 !important;
  position: absolute;
  background: transparent !important;
  box-shadow: none;
  border: 1px solid rgba(0, 0, 0, 0.2);
  color: black;
}

.sm-prop:focus {
  background: rgba(0, 0, 0, 0.1) !important;
}

.sm-mlt {
  font-size: 16px;
  resize: none;
}

.sm-num {
  text-align: center;
}

.sm-roll {
  cursor: pointer;
}

.sm-checkbox {
  cursor: pointer;
  appearance: none;
}

.sm-checkbox:checked {
  appearance: auto;
}

.sm-noedit {
  border: none;
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
}

function countVisit() {
  fetch('https://api.countapi.xyz/hit/oskaerik.github.io/visits');
}
