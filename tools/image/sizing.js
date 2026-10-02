export const ASPECTS = {
  '1:1': [1, 1], '4:3': [4, 3], '3:2': [3, 2], '16:9': [16, 9],
  '2:1': [2, 1], '3:4': [3, 4], '4:5': [4, 5], '2:3': [2, 3], '9:16': [9, 16],
};
export const SIZE_CHOICES = [
  [0, '不放大原图'], [512, '小图'], [800, '聊天发图'], [1080, '日常配图'],
  [1280, '清晰配图'], [1440, '图文大图'], [1600, '照片大图'], [1920, '高清大图'],
  [2560, '超清大图'], [3840, '4K 大图'],
];
export const PRESETS = {
  avatar: { aspect: '1:1', edge: 512 },
  square: { aspect: '1:1', edge: 1080 },
  portrait: { aspect: '3:4', edge: 1440 },
  wallpaper: { aspect: '9:16', edge: 1920 },
  cover: { aspect: '16:9', edge: 1920 },
  photo: { aspect: '4:3', edge: 1600 },
};

export function outputSize(sourceWidth, sourceHeight, { aspect = 'original', edge = 0, width, height } = {}) {
  if (!(sourceWidth > 0 && sourceHeight > 0)) throw new Error('无法读取原图尺寸。');
  if (aspect === 'custom') {
    if (![width, height].every(value => Number.isInteger(value) && value >= 1 && value <= 6000)) {
      throw new Error('宽和高请填写 1–6000 之间的整数。');
    }
    return { width, height };
  }
  if (aspect === 'original') {
    const scale = edge > 0 ? Math.min(1, edge / Math.max(sourceWidth, sourceHeight)) : 1;
    return { width: Math.max(1, Math.round(sourceWidth * scale)), height: Math.max(1, Math.round(sourceHeight * scale)) };
  }
  const ratio = ASPECTS[aspect];
  if (!ratio) throw new Error('请选择一个有效的图片比例。');
  const [rw, rh] = ratio;
  const units = edge > 0
    ? Math.max(1, Math.round(edge / Math.max(rw, rh)))
    : Math.max(1, Math.floor(Math.min(sourceWidth / rw, sourceHeight / rh)));
  return { width: rw * units, height: rh * units };
}

export function renderPlan(sourceWidth, sourceHeight, width, height, fit = 'crop', position = 'center') {
  if (![sourceWidth, sourceHeight, width, height].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error('图片尺寸无效。');
  }
  if (fit === 'contain') {
    const scale = Math.min(width / sourceWidth, height / sourceHeight);
    const dw = sourceWidth * scale, dh = sourceHeight * scale;
    return { sx: 0, sy: 0, sw: sourceWidth, sh: sourceHeight, dx: (width - dw) / 2, dy: (height - dh) / 2, dw, dh, upscaled: scale > 1.00001 };
  }
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const sw = width / scale, sh = height / scale;
  const positions = { center: [.5, .5], top: [.5, 0], bottom: [.5, 1], left: [0, .5], right: [1, .5] };
  const [x, y] = positions[position] || positions.center;
  return { sx: (sourceWidth - sw) * x, sy: (sourceHeight - sh) * y, sw, sh, dx: 0, dy: 0, dw: width, dh: height, upscaled: scale > 1.00001 };
}
