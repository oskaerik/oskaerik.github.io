const state = {};

const $filePicker = document.getElementById('file-picker');
const $code = document.getElementById('code');
const $iframe = document.getElementById('iframe');
const $$createAttrButtons = document.querySelectorAll('.create-attr');

const $sheet = $iframe.contentDocument.getElementById('sheet');

const onFilePicked = (e) => {
  const file = e.target.files[0];

  const reader = new FileReader();
  reader.onload = (readerEvent) => {
    const dataUrl = readerEvent.target.result;

    const image = new Image();
    image.onload = function () {
      $sheet.style.width = `${this.naturalWidth}px`;
      $sheet.style.height = `${this.naturalHeight}px`;
    };
    image.src = dataUrl;

    $sheet.style.backgroundImage = `url(${dataUrl})`;
    $sheet.style.backgroundSize = 'contain';

    $code.textContent = $sheet.outerHTML;
  };

  reader.readAsDataURL(file);
};

$filePicker.onchange = onFilePicked;

function createSingleLineText() {
  alert('Clicked!');
}

// Print all IDs
let s = '';
document.querySelectorAll('[id]').forEach((el) => {
  const { id } = el;
  const name = id.replace(/-(.)/g, (_, c) => c.toUpperCase());
  s += `const $${name} = document.getElementById('${id}')\n`;
});
console.log(s);
