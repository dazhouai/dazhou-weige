import { SIZE_CHOICES, PRESETS, outputSize, renderPlan } from './sizing.js';

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_PIXELS = 36_000_000;
const formats = {
  'image/jpeg': { extension: 'jpg', label: 'JPG' },
  'image/webp': { extension: 'webp', label: 'WebP' },
  'image/png': { extension: 'png', label: 'PNG' },
};

const input = document.querySelector('#image-input');
const dropZone = document.querySelector('#drop-zone');
const fileError = document.querySelector('#file-error');
const resultError = document.querySelector('#result-error');
const sourceName = document.querySelector('#source-name');
const settings = document.querySelector('#settings');
const format = document.querySelector('#format');
const maxEdge = document.querySelector('#max-edge');
const aspect = document.querySelector('#aspect-ratio');
const customWidth = document.querySelector('#custom-width');
const customHeight = document.querySelector('#custom-height');
const fitMode = document.querySelector('#fit-mode');
const cropPosition = document.querySelector('#crop-position');
const sizeNote = document.querySelector('#output-size-note');
const presetButtons = [...document.querySelectorAll('[data-size-preset]')];
const quality = document.querySelector('#quality');
const qualityValue = document.querySelector('#quality-value');
const formatNote = document.querySelector('#format-note');
const emptyResult = document.querySelector('#empty-result');
const result = document.querySelector('#result');
const beforePreview = document.querySelector('#before-preview');
const afterPreview = document.querySelector('#after-preview');
const download = document.querySelector('#download');
const status = document.querySelector('#process-status');
const sizeChange = document.querySelector('#size-change');

let originalFile = null;
let originalImage = null;
let downloadUrl = '';
let version = 0;
let debounceTimer = 0;

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

function releaseDownload() {
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = '';
  download.removeAttribute('href');
  download.hidden = true;
}

function closeImage(image) {
  if (image && typeof image.close === 'function') image.close();
}

function decodeImage(blob) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('图片读取失败。'));
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('浏览器无法识别这张图片。'));
      image.src = reader.result;
    };
    reader.readAsDataURL(blob);
  });
}

function dimensions(image) {
  return { width: image.width || image.naturalWidth, height: image.height || image.naturalHeight };
}

function drawPreview(canvas, image) {
  const { width, height } = dimensions(image);
  const scale = Math.min(1, 640 / width, 480 / height);
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
}

function canvasBlob(canvas, type, outputQuality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('浏览器无法导出这张图片。')), type, outputQuality);
  });
}

function updateFormatControls() {
  const lossless = format.value === 'image/png';
  quality.disabled = lossless;
  qualityValue.textContent = lossless ? '无损' : `${quality.value}%`;
  formatNote.textContent = lossless
    ? 'PNG 为无损格式，画质滑块不适用；文件可能比原图更大。'
    : format.value === 'image/jpeg'
      ? 'JPG 不保留透明背景，透明区域会变成白色。'
      : '画质越低，通常文件越小。实际大小取决于图片内容。';
}

function sizeOptions() {
  return { aspect: aspect.value, edge: Number(maxEdge.value), width: Number(customWidth.value), height: Number(customHeight.value) };
}

function populateSizes() {
  if (!originalImage || aspect.value === 'custom') return;
  const source = dimensions(originalImage);
  const selected = maxEdge.value || '0';
  maxEdge.replaceChildren(...SIZE_CHOICES.map(([edge, label]) => {
    const size = outputSize(source.width, source.height, { aspect: aspect.value, edge });
    const name = edge === 0 && aspect.value === 'original' ? '保持原尺寸' : label;
    return new Option(`${name} · ${size.width} × ${size.height} 像素`, String(edge));
  }));
  maxEdge.value = selected;
}

function updateSizeControls() {
  const custom = aspect.value === 'custom';
  const changedRatio = aspect.value !== 'original';
  document.querySelector('#standard-size-field').hidden = custom;
  document.querySelector('#custom-size-fields').hidden = !custom;
  document.querySelector('#fit-controls').hidden = !changedRatio;
  document.querySelector('#crop-position-field').hidden = fitMode.value !== 'crop';
  presetButtons.forEach(button => {
    const preset = PRESETS[button.dataset.sizePreset];
    button.setAttribute('aria-pressed', String(preset.aspect === aspect.value && preset.edge === Number(maxEdge.value)));
  });
  if (!originalImage) return;
  const source = dimensions(originalImage);
  const size = outputSize(source.width, source.height, sizeOptions());
  const plan = renderPlan(source.width, source.height, size.width, size.height, changedRatio ? fitMode.value : 'contain', cropPosition.value);
  const behavior = !changedRatio ? '保留完整原图' : fitMode.value === 'contain' ? '完整保留，白边补齐' : `裁剪保留${cropPosition.options[cropPosition.selectedIndex].textContent.split(' · ')[0]}`;
  const ratio = changedRatio && !custom ? ` · ${aspect.value}` : '';
  sizeNote.textContent = `导出 ${size.width} × ${size.height} 像素${ratio} · ${behavior}。${plan.upscaled ? '原图较小，会放大；清晰度不会增加。' : ''}`;
  sizeNote.classList.toggle('is-upscale', plan.upscaled);
  return { size, plan };
}

function queueProcessing(delay = 0) {
  ++version;
  releaseDownload();
  clearTimeout(debounceTimer);
  try { updateSizeControls(); }
  catch (error) {
    sizeNote.textContent = error.message;
    sizeNote.classList.add('is-upscale');
    document.querySelector('#after-size').textContent = '—';
    document.querySelector('#after-dimensions').textContent = '—';
    sizeChange.textContent = '';
    return;
  }
  if (delay) debounceTimer = setTimeout(processImage, delay);
  else processImage();
}

async function processImage() {
  if (!originalFile || !originalImage) return;
  const current = ++version;
  releaseDownload();
  showError(resultError, '');
  status.textContent = '正在处理图片…';
  document.querySelector('#after-size').textContent = '处理中';
  document.querySelector('#after-dimensions').textContent = '—';
  sizeChange.textContent = '';
  try {
    const { size: { width, height }, plan } = updateSizeControls();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('浏览器无法处理这张图片，请尝试更小的图片。');
    if (format.value === 'image/jpeg' || (aspect.value !== 'original' && fitMode.value === 'contain')) {
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(originalImage, plan.sx, plan.sy, plan.sw, plan.sh, plan.dx, plan.dy, plan.dw, plan.dh);
    const blob = await canvasBlob(canvas, format.value, Number(quality.value) / 100);
    canvas.width = canvas.height = 0;
    if (current !== version) return;
    if (blob.type !== format.value) throw new Error(`当前浏览器不支持导出 ${formats[format.value].label}，请换一种格式。`);
    const processed = await decodeImage(blob);
    if (current !== version) { closeImage(processed); return; }
    drawPreview(afterPreview, processed);
    closeImage(processed);
    document.querySelector('#after-size').textContent = formatSize(blob.size);
    document.querySelector('#after-dimensions').textContent = `${width} × ${height} 像素 · ${formats[format.value].label}`;
    const percent = Math.abs((1 - blob.size / originalFile.size) * 100).toFixed(1);
    const larger = blob.size > originalFile.size;
    sizeChange.classList.toggle('is-larger', larger);
    sizeChange.textContent = larger
      ? `文件增大 ${percent}%：可以降低画质、缩小尺寸，或换一种格式。`
      : blob.size === originalFile.size ? '导出文件与原图大小相同。' : `文件减小 ${percent}%。`;
    downloadUrl = URL.createObjectURL(blob);
    download.href = downloadUrl;
    const baseName = originalFile.name.replace(/\.(jpe?g|png|webp)$/i, '').slice(0, 80) || 'image';
    download.download = `${baseName}-dazhou.${formats[format.value].extension}`;
    download.hidden = false;
    status.textContent = `处理完成。导出文件 ${formatSize(blob.size)}。`;
  } catch (error) {
    if (current !== version) return;
    document.querySelector('#after-size').textContent = '—';
    showError(resultError, error.message || '处理失败，请换一张图片重试。');
    status.textContent = '处理失败。';
  }
}

async function setFile(file) {
  const current = ++version;
  clearTimeout(debounceTimer);
  releaseDownload();
  closeImage(originalImage);
  originalImage = null;
  originalFile = null;
  settings.hidden = true;
  result.hidden = true;
  emptyResult.hidden = false;
  sourceName.hidden = true;
  dropZone.classList.remove('has-image');
  dropZone.querySelector('strong').textContent = '点击选择，或把图片拖到这里';
  showError(fileError, '');
  if (!file) return;
  const type = file.type || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' })[file.name.split('.').pop().toLowerCase()];
  if (!formats[type]) return showError(fileError, '请选择 JPG、PNG 或 WebP 图片。动图和 HEIC 暂不支持。');
  if (file.size > MAX_BYTES) return showError(fileError, '图片超过 25 MB。请先选择较小的图片。');
  if (!file.size) return showError(fileError, '图片文件是空的，请重新选择。');
  status.textContent = '正在读取图片…';
  try {
    let image;
    try { image = await decodeImage(file); }
    catch { throw new Error('浏览器无法识别这张图片。请换一张 JPG、PNG 或 WebP 图片。'); }
    if (current !== version) { closeImage(image); return; }
    const { width, height } = dimensions(image);
    if (!width || !height || width * height > MAX_PIXELS) {
      closeImage(image);
      throw new Error('图片像素过大或无法读取；请选用不超过 3600 万像素的图片。');
    }
    originalFile = file;
    originalImage = image;
    sourceName.textContent = `${file.name} · ${formatSize(file.size)}`;
    sourceName.hidden = false;
    dropZone.classList.add('has-image');
    dropZone.querySelector('strong').textContent = '点击更换，或拖入另一张图片';
    format.value = type === 'image/png' ? 'image/webp' : type;
    aspect.value = 'original';
    maxEdge.value = '0';
    customWidth.value = String(width);
    customHeight.value = String(height);
    fitMode.value = 'crop';
    cropPosition.value = 'center';
    quality.value = '82';
    populateSizes();
    updateSizeControls();
    updateFormatControls();
    drawPreview(beforePreview, image);
    document.querySelector('#before-size').textContent = formatSize(file.size);
    document.querySelector('#before-dimensions').textContent = `${width} × ${height} 像素`;
    settings.hidden = false;
    emptyResult.hidden = true;
    result.hidden = false;
    await processImage();
  } catch (error) {
    if (current !== version) return;
    showError(fileError, error.message || '浏览器无法打开这张图片。');
    status.textContent = '读取失败。';
  }
}

input.addEventListener('change', () => { setFile(input.files?.[0]); input.value = ''; });
for (const eventName of ['dragenter', 'dragover']) dropZone.addEventListener(eventName, event => {
  event.preventDefault();
  dropZone.classList.add('is-dragover');
});
for (const eventName of ['dragleave', 'drop']) dropZone.addEventListener(eventName, event => {
  event.preventDefault();
  dropZone.classList.remove('is-dragover');
});
dropZone.addEventListener('drop', event => setFile(event.dataTransfer?.files?.[0]));
format.addEventListener('change', () => { updateFormatControls(); queueProcessing(); });
aspect.addEventListener('change', () => { populateSizes(); queueProcessing(); });
maxEdge.addEventListener('change', () => queueProcessing());
fitMode.addEventListener('change', () => queueProcessing());
cropPosition.addEventListener('change', () => queueProcessing());
for (const control of [customWidth, customHeight]) control.addEventListener('input', () => queueProcessing(250));
presetButtons.forEach(button => button.addEventListener('click', () => {
  const preset = PRESETS[button.dataset.sizePreset];
  aspect.value = preset.aspect;
  maxEdge.value = String(preset.edge);
  fitMode.value = 'crop';
  cropPosition.value = 'center';
  populateSizes();
  queueProcessing();
}));
quality.addEventListener('input', () => {
  qualityValue.textContent = `${quality.value}%`;
  queueProcessing(200);
});
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  ++version;
  clearTimeout(debounceTimer);
  releaseDownload();
  closeImage(originalImage);
});
