// Generate an "infoplus" logo PNG using only Node built-ins.
// Approach: build a 400x400 raw RGBA buffer, encode as PNG via zlib.

const fs = require('fs');
const zlib = require('zlib');

const W = 400, H = 400;
const buf = Buffer.alloc(W * H * 4);

// Colors
const BLUE = [0x1A, 0x3A, 0x8E, 0xFF];   // French blue
const RED  = [0xE3, 0x06, 0x13, 0xFF];   // French red
const WHITE = [0xFF, 0xFF, 0xFF, 0xFF];

// Fill background: left half blue, right half red
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const c = x < W / 2 ? BLUE : RED;
    const o = (y * W + x) * 4;
    buf[o] = c[0]; buf[o+1] = c[1]; buf[o+2] = c[2]; buf[o+3] = c[3];
  }
}

// Draw white circle radius 160 centered at (200, 200)
const CX = 200, CY = 200, R = 160;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x - CX, dy = y - CY;
    if (dx * dx + dy * dy <= R * R) {
      const o = (y * W + x) * 4;
      buf[o] = WHITE[0]; buf[o+1] = WHITE[1]; buf[o+2] = WHITE[2]; buf[o+3] = WHITE[3];
    }
  }
}

// Simple 5x7 pixel font for a few letters
// Each glyph = 7 rows of 5 bits (1 = pixel on)
const F = {
  i: [0b00100, 0b00000, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  n: [0b00000, 0b00000, 0b11110, 0b10001, 0b10001, 0b10001, 0b10001],
  f: [0b00110, 0b01000, 0b01000, 0b11110, 0b01000, 0b01000, 0b01000],
  o: [0b00000, 0b00000, 0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
  p: [0b00000, 0b00000, 0b11110, 0b10001, 0b11110, 0b10000, 0b10000],
  l: [0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  u: [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b10001, 0b01111],
  s: [0b00000, 0b00000, 0b01110, 0b10000, 0b01110, 0b00001, 0b11110],
  '.':[0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00110, 0b00110],
};

function drawChar(ch, x0, y0, scale, color) {
  const g = F[ch]; if (!g) return;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 5; c++) {
      if (!(g[r] & (1 << (4 - c)))) continue;
      // Draw a scale*scale block for each "on" pixel
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const x = x0 + c * scale + dx;
          const y = y0 + r * scale + dy;
          if (x < 0 || x >= W || y < 0 || y >= H) continue;
          const o = (y * W + x) * 4;
          buf[o] = color[0]; buf[o+1] = color[1]; buf[o+2] = color[2]; buf[o+3] = color[3];
        }
      }
    }
  }
}

function drawText(text, x0, y0, scale, color) {
  const charW = 5 * scale;
  const gap = scale;
  let x = x0;
  for (const ch of text) {
    drawChar(ch, x, y0, scale, color);
    x += charW + gap;
  }
}

// "infoplus." text: "info" in blue, "plus." in red
// Total = 9 chars * (5 + 1) * scale = 54 * scale wide
// Use scale = 5 → text ~270px wide, centered at x = (400-270)/2 = 65
const SCALE = 5;
const charTotalW = 5 * SCALE + SCALE; // per char
const infoW = 4 * charTotalW;         // "info"
const plusW = 5 * charTotalW;         // "plus."
const totalW = infoW + plusW - SCALE; // minus one trailing gap
const startX = (W - totalW) / 2;
const yText = 200 - (7 * SCALE) / 2;

drawText('info', startX, yText, SCALE, BLUE);
drawText('plus.', startX + infoW, yText, SCALE, RED);

// ---- PNG encoding ----
// PNG needs: IHDR, IDAT (compressed), IEND
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

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 6;   // color type = RGBA
ihdr[10] = 0;  // compression = deflate
ihdr[11] = 0;  // filter = adaptive
ihdr[12] = 0;  // interlace = none

// Raw image data with filter byte per row
const rowLen = W * 4;
const raw = Buffer.alloc(H * (rowLen + 1));
for (let y = 0; y < H; y++) {
  raw[y * (rowLen + 1)] = 0; // filter type = None
  buf.copy(raw, y * (rowLen + 1) + 1, y * rowLen, y * rowLen + rowLen);
}
const idat = zlib.deflateSync(raw);

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG signature
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

fs.writeFileSync('infoplus-logo.png', png);
console.log('infoplus-logo.png created:', png.length, 'bytes');
