const $sheetImageUrl = document.getElementById('sheet-image-url');
const $newAttribute = document.getElementById('new-attribute');
const $copyHtml = document.getElementById('copy-html');
const $iframe = document.getElementById('iframe');
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
$newAttribute.addEventListener('click', newAttribute);
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

function newAttribute() {
  alert('Clicked!');
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
