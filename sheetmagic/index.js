const state = { imageUrl: null };

const setInitialState = () => {
  const queryString = new URLSearchParams(window.location.search);
  for (const [key, value] of queryString) {
    if (key in state) state[key] = value;
  }
  console.log('Initial state:', state);

  $sheetImageUrl.value = getImageUrl();
  $sheetImageUrl.dispatchEvent(new Event('change'));
};

const setImageUrl = (imageUrl) => {
  state.imageUrl = imageUrl;
  updateQueryString();
};

const getImageUrl = () => state.imageUrl;

const updateQueryString = () => {
  const queryString = new URLSearchParams(state).toString();
  // window.location.search = queryString;
};

const $sheetImageUrl = document.getElementById('sheet-image-url');
const $iframe = document.getElementById('iframe');
const $sheet = $iframe.contentDocument.getElementById('sheet');

const setSheetImage = async () => {
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
};

const createSingleLineText = () => {
  alert('Clicked!');
};

const copyHtml = () => {
  navigator.clipboard.writeText($sheet.outerHTML);
};

/* --- Development --- */
let s = '';
document.querySelectorAll('[id]').forEach((el) => {
  const { id } = el;
  const name = id.replace(/-(.)/g, (_, c) => c.toUpperCase());
  s += `const $${name} = document.getElementById('${id}')\n`;
});
console.log(s);

setInitialState();
