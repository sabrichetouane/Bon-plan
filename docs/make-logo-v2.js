// Better Info Plus logo with anti-aliased circle and cleaner text.
// Generates infoplus-logo.png (400x400).

const fs = require('fs');
const zlib = require('zlib');

const W = 400, H = 400;
const buf = Buffer.alloc(W * H * 4);

const BLUE  = [0x1A, 0x3A, 0x8E];
const RED   = [0xE3, 0x06, 0x13];
const WHITE = [0xFF, 0xFF, 0xFF];

const setPx = (x, y, rgb, alpha = 255) => {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const o = (y * W + x) * 4;
  if (alpha === 255) {
    buf[o] = rgb[0]; buf[o+1] = rgb[1]; buf[o+2] = rgb[2]; buf[o+3] = 255;
  } else {
    // Alpha blending
    const a = alpha / 255;
    buf[o]   = Math.round(rgb[0] * a + buf[o]   * (1 - a));
    buf[o+1] = Math.round(rgb[1] * a + buf[o+1] * (1 - a));
    buf[o+2] = Math.round(rgb[2] * a + buf[o+2] * (1 - a));
    buf[o+3] = 255;
  }
};

// Fill background halves
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    setPx(x, y, x < W / 2 ? BLUE : RED);
  }
}

// Anti-aliased circle
const CX = 200, CY = 200, R = 160;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x - CX + 0.5, dy = y - CY + 0.5;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < R - 1) setPx(x, y, WHITE);
    else if (d < R + 1) {
      const alpha = Math.max(0, Math.min(1, R + 1 - d)) * 255;
      setPx(x, y, WHITE, alpha);
    }
  }
}

// Better 8x11 font with slight anti-aliasing built in
// Each glyph = 11 rows of 8 pixels (0=off, 1=on)
const F8 = {
  i: [
    0b00011000,
    0b00011000,
    0b00000000,
    0b00111000,
    0b00111000,
    0b00011000,
    0b00011000,
    0b00011000,
    0b00011000,
    0b00111100,
    0b00111100,
  ],
  n: [
    0b00000000,
    0b00000000,
    0b00000000,
    0b11011100,
    0b11101110,
    0b11100110,
    0b11000110,
    0b11000110,
    0b11000110,
    0b11000110,
    0b11000110,
  ],
  f: [
    0b00011100,
    0b00110110,
    0b00110000,
    0b01111100,
    0b00110000,
    0b00110000,
    0b00110000,
    0b00110000,
    0b00110000,
    0b00110000,
    0b00110000,
  ],
  o: [
    0b00000000,
    0b00000000,
    0b00000000,
    0b01111100,
    0b11000110,
    0b11000110,
    0b11000110,
    0b11000110,
    0b11000110,
    0b11000110,
    0b01111100,
  ],
  p: [
    0b00000000,
    0b00000000,
    0b00000000,
    0b11011100,
    0b11100110,
    0b11000110,
    0b11000110,
    0b11100110,
    0b11011100,
    0b11000000,
    0b11000000,
  ],
  l: [
    0b00110000,
    0b01110000,
    0b00110000,
    0b00110000,
    0b00110000,
    0b00110000,
    0b00110000,
    0b00110000,
    0b00110000,
    0b00110000,
    0b01111000,
  ],
  u: [
    0b00000000,
    0b00000000,
    0b00000000,
    0b11000110,
    0b11000110,
    0b11000110,
    0b11000110,
    0b11000110,
    0b11000110,
    0b11101110,
    0b01110110,
  ],
  s: [
    0b00000000,
    0b00000000,
    0b00000000,
    0b01111100,
    0b11000110,
    0b11000000,
    0b01111100,
    0b00000110,
    0b00000110,
    0b11000110,
    0b01111100,
  ],
  '.': [
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00110000,
    0b00110000,
  ],
};

function drawGlyph(ch, x0, y0, scale, color) {
  const g = F8[ch]; if (!g) return;
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 8; c++) {
      if (!(g[r] & (1 << (7 - c)))) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          setPx(x0 + c * scale + dx, y0 + r * scale + dy, color);
        }
      }
    }
  }
}

function textWidth(text, scale, gap = 1) {
  // Each glyph 8 wide, plus gap
  return text.length * (8 * scale + gap * scale) - gap * scale;
}

function drawText(text, x0, y0, scale, color, gap = 1) {
  let x = x0;
  for (const ch of text) {
    drawGlyph(ch, x, y0, scale, color);
    x += 8 * scale + gap * scale;
  }
}

// Draw "infoplus." centered on the white circle
const SCALE = 4;
const infoW = textWidth('info', SCALE);
const plusW = textWidth('plus.', SCALE);
const gapBetween = SCALE;  // small gap between "info" and "plus."
const totalW = infoW + gapBetween + plusW;
const startX = Math.round((W - totalW) / 2);
const yText = Math.round((H - 11 * SCALE) / 2);

drawText('info', startX, yText, SCALE, BLUE);
drawText('plus.', startX + infoW + gapBetween, yText, SCALE, RED);

// ---- PNG encoding ----
function chunk(type, data) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c;
  }
  const typeBuf = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([typeBuf, data]);
  let crc = 0xFFFFFFFF;
  for (const b of combined) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  crc = (crc ^ 0xFFFFFFFF) >>> 0;
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcB]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const rowLen = W * 4;
const raw = Buffer.alloc(H * (rowLen + 1));
for (let y = 0; y < H; y++) {
  raw[y * (rowLen + 1)] = 0;
  buf.copy(raw, y * (rowLen + 1) + 1, y * rowLen, y * rowLen + rowLen);
}
const idat = zlib.deflateSync(raw);

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.writeFileSync('infoplus-logo.png', png);
console.log('infoplus-logo.png (v2) created:', png.length, 'bytes');
