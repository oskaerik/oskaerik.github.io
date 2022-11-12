const state = { sheetWidth: null, sheetHeight: null, sheetImage: null };

const $sheetImageUrl = document.getElementById('sheet-image-url');
const $iframe = document.getElementById('iframe');
const $sheet = $iframe.contentDocument.getElementById('sheet');

const setImageUrl = async () => {
  const imageUrl = $sheetImageUrl.value;
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

$sheetImageUrl.value = 'https://i.ibb.co/25t9dLN/mazes-and-minotaurs.jpg';
$sheetImageUrl.dispatchEvent(new Event('change'));
