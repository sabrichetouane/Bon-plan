// Generate PNG mockups of the Bon Plan Bizerte app screens.
// Each mockup is 750x1500 (iPhone aspect ratio).
// Output: mockup-splash.png, mockup-onboarding.png, mockup-home.png,
//         mockup-category.png, mockup-detail.png, mockup-map.png,
//         mockup-itinerary.png, mockup-profile.png

const fs = require('fs');
const zlib = require('zlib');

const W = 750, H = 1500;

// Color palette (matches the actual app)
const COL = {
  primary:    [0x1D, 0x2B, 0xEF],
  primarySoft:[0xE8, 0xEA, 0xFE],
  bg:         [0xFF, 0xFF, 0xFF],
  card:       [0xFF, 0xFF, 0xFF],
  surface:    [0xF6, 0xF7, 0xFB],
  text:       [0x0F, 0x12, 0x26],
  textMute:   [0x9A, 0xA0, 0xB4],
  textSec:    [0x6B, 0x70, 0x80],
  border:     [0xED, 0xEF, 0xF5],
  star:       [0xF5, 0xB9, 0x3B],
  danger:     [0xEF, 0x44, 0x44],
  success:    [0x22, 0xC5, 0x5E],
  warning:    [0xF5, 0x9E, 0x0B],
  accent2:    [0x8B, 0x5C, 0xF6],
  cyan:       [0x06, 0xB6, 0xD4],
  white:      [0xFF, 0xFF, 0xFF],
};

// ---------- Painter class ----------
class Canvas {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.buf = Buffer.alloc(w * h * 4);
    this.fill(COL.bg);
  }
  setPx(x, y, rgb, a = 255) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const o = (y * this.w + x) * 4;
    if (a === 255) {
      this.buf[o]=rgb[0]; this.buf[o+1]=rgb[1]; this.buf[o+2]=rgb[2]; this.buf[o+3]=255;
    } else {
      const ratio = a / 255;
      this.buf[o]   = Math.round(rgb[0] * ratio + this.buf[o]   * (1 - ratio));
      this.buf[o+1] = Math.round(rgb[1] * ratio + this.buf[o+1] * (1 - ratio));
      this.buf[o+2] = Math.round(rgb[2] * ratio + this.buf[o+2] * (1 - ratio));
      this.buf[o+3] = 255;
    }
  }
  fill(rgb) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.setPx(x, y, rgb);
  }
  rect(x, y, w, h, rgb) {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) this.setPx(x+dx, y+dy, rgb);
  }
  // Rounded rectangle - simple approximation
  roundRect(x, y, w, h, r, rgb) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        // Check if in corner region
        let cornerX, cornerY;
        if (dx < r && dy < r) { cornerX = r - dx; cornerY = r - dy; }
        else if (dx >= w - r && dy < r) { cornerX = dx - (w - r - 1); cornerY = r - dy; }
        else if (dx < r && dy >= h - r) { cornerX = r - dx; cornerY = dy - (h - r - 1); }
        else if (dx >= w - r && dy >= h - r) { cornerX = dx - (w - r - 1); cornerY = dy - (h - r - 1); }
        else { this.setPx(x+dx, y+dy, rgb); continue; }
        const d = Math.sqrt(cornerX*cornerX + cornerY*cornerY);
        if (d < r - 0.5) this.setPx(x+dx, y+dy, rgb);
        else if (d < r + 0.5) {
          const a = Math.max(0, Math.min(1, r + 0.5 - d)) * 255;
          this.setPx(x+dx, y+dy, rgb, a);
        }
      }
    }
  }
  circle(cx, cy, r, rgb) {
    for (let y = cy - r - 1; y <= cy + r + 1; y++) {
      for (let x = cx - r - 1; x <= cx + r + 1; x++) {
        const dx = x - cx, dy = y - cy;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < r - 0.5) this.setPx(x, y, rgb);
        else if (d < r + 0.5) {
          const a = Math.max(0, Math.min(1, r + 0.5 - d)) * 255;
          this.setPx(x, y, rgb, a);
        }
      }
    }
  }
  // Vertical linear gradient
  vGradient(x, y, w, h, colTop, colBottom) {
    for (let dy = 0; dy < h; dy++) {
      const t = dy / h;
      const c = [
        Math.round(colTop[0] * (1 - t) + colBottom[0] * t),
        Math.round(colTop[1] * (1 - t) + colBottom[1] * t),
        Math.round(colTop[2] * (1 - t) + colBottom[2] * t),
      ];
      for (let dx = 0; dx < w; dx++) this.setPx(x+dx, y+dy, c);
    }
  }
  // Draws a stylized "text-like" block representing a text line at position.
  // width/height for a rough visual representation
  textLine(x, y, w, h, rgb) {
    this.roundRect(x, y, w, h, Math.min(h/2, 3), rgb);
  }
  // Icon: solid rounded square (representing an icon)
  iconSquare(x, y, size, rgb) {
    this.roundRect(x, y, size, size, size / 3, rgb);
  }
  // PNG output
  toPNG() {
    const chunk = (type, data) => {
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
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0); ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    const rowLen = this.w * 4;
    const raw = Buffer.alloc(this.h * (rowLen + 1));
    for (let y = 0; y < this.h; y++) {
      raw[y * (rowLen + 1)] = 0;
      this.buf.copy(raw, y * (rowLen + 1) + 1, y * rowLen, y * rowLen + rowLen);
    }
    const idat = zlib.deflateSync(raw);
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
      chunk('IHDR', ihdr),
      chunk('IDAT', idat),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

// Draw the standard iPhone status bar + notch
function drawStatusBar(c) {
  c.rect(0, 0, W, 40, COL.white);
  // Left: time as short block
  c.textLine(40, 15, 50, 14, COL.text);
  // Right: battery + signal
  c.textLine(W - 100, 15, 25, 12, COL.text);
  c.textLine(W - 65,  15, 20, 12, COL.text);
  c.roundRect(W - 40, 12, 30, 16, 3, COL.text);
}

// Draw the bottom tab bar (Home / Map / Itinerary / Profile)
function drawTabBar(c, active = 0) {
  const barY = H - 100;
  c.rect(0, barY, W, 100, COL.white);
  c.rect(0, barY, W, 1, COL.border);
  const labels = ['Home', 'Map', 'Itin', 'Prof'];
  for (let i = 0; i < 4; i++) {
    const x = 60 + i * ((W - 120) / 3);
    const col = i === active ? COL.primary : COL.textMute;
    c.circle(x, barY + 32, 12, col);
    c.textLine(x - 20, barY + 55, 40, 8, col);
  }
  // Home indicator
  c.roundRect(W / 2 - 60, H - 12, 120, 5, 2, COL.text);
}

// ---------- 1. SPLASH ----------
function splash() {
  const c = new Canvas(W, H);
  c.vGradient(0, 0, W, H, [0x0E, 0x1B, 0xCF], [0x3A, 0x46, 0xFF]);
  // Big blob top-left
  c.circle(-100, -100, 400, [255, 255, 255, 20]);
  for (let y = -100; y < 300; y++) {
    for (let x = -200; x < 300; x++) {
      const dx = x + 100, dy = y + 100;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 400) c.setPx(x, y, [255, 255, 255], 20);
    }
  }
  // Center: white rounded card + "Bp" text
  c.roundRect(W/2 - 100, H/2 - 200, 200, 200, 40, COL.white);
  // Big Bp inside
  c.textLine(W/2 - 40, H/2 - 130, 80, 8, COL.primary);
  c.textLine(W/2 - 50, H/2 - 110, 100, 60, COL.primary);
  c.textLine(W/2 - 50, H/2 - 45, 100, 8, COL.primary);
  // Title
  c.textLine(W/2 - 120, H/2 + 40, 240, 40, COL.white);
  c.textLine(W/2 - 80, H/2 + 100, 160, 40, COL.white);
  fs.writeFileSync('mockup-splash.png', c.toPNG());
  console.log('mockup-splash.png done');
}

// ---------- 2. ONBOARDING ----------
function onboarding() {
  const c = new Canvas(W, H);
  drawStatusBar(c);
  // Skip button top right
  c.textLine(W - 100, 90, 60, 24, COL.textMute);
  // Illustration area - map with pins
  const mapY = 200, mapH = 500;
  c.roundRect(W/2 - 240, mapY, 480, mapH, 50, COL.primarySoft);
  // Roads
  c.textLine(W/2 - 200, mapY + 60,  360, 15, COL.white);
  c.textLine(W/2 - 180, mapY + 150, 320, 15, COL.white);
  c.textLine(W/2 - 220, mapY + 240, 400, 15, COL.white);
  c.textLine(W/2 - 190, mapY + 340, 340, 15, COL.white);
  c.textLine(W/2 - 180, mapY + 430, 260, 15, COL.white);
  // Pins
  c.circle(W/2 - 140, mapY + 90, 30, COL.danger);
  c.circle(W/2 + 100, mapY + 200, 30, COL.primary);
  c.circle(W/2 - 60, mapY + 380, 30, COL.success);
  // Title text
  c.textLine(W/2 - 200, 800, 400, 40, COL.text);
  c.textLine(W/2 - 250, 870, 500, 20, COL.textSec);
  c.textLine(W/2 - 230, 900, 460, 20, COL.textSec);
  c.textLine(W/2 - 200, 930, 400, 20, COL.textSec);
  // Dots
  c.roundRect(W/2 - 30, 1050, 40, 12, 6, COL.primary);
  c.circle(W/2 + 30, 1056, 8, COL.border);
  // Button
  c.roundRect(80, 1200, W - 160, 100, 24, COL.primary);
  c.textLine(W/2 - 40, 1240, 80, 20, COL.white);
  fs.writeFileSync('mockup-onboarding.png', c.toPNG());
  console.log('mockup-onboarding.png done');
}

// ---------- 3. HOME ----------
function home() {
  const c = new Canvas(W, H);
  drawStatusBar(c);
  // City pill left, bell right
  c.roundRect(50, 80, 200, 60, 30, COL.primarySoft);
  c.circle(85, 110, 15, COL.primary);
  c.textLine(115, 100, 100, 24, COL.text);
  c.circle(W - 90, 110, 30, COL.surface);
  c.circle(W - 78, 96, 8, COL.danger);
  // Search bar
  c.roundRect(50, 180, W - 100, 90, 24, COL.surface);
  c.circle(85, 225, 12, COL.textMute);
  c.textLine(115, 210, 300, 30, COL.textMute);
  // Categories row (6 icons)
  const catY = 320, catSize = 100;
  const catColors = [COL.primary, COL.accent2, COL.warning, COL.success, COL.cyan, COL.danger];
  for (let i = 0; i < 6; i++) {
    const x = 50 + i * 105;
    if (x + catSize > W) break;
    c.circle(x + catSize/2, catY + catSize/2, catSize/2, i === 0 ? catColors[i] : COL.primarySoft);
    c.textLine(x + 20, catY + catSize + 20, 60, 15, COL.text);
  }
  // Banner "Plan your day"
  const banY = 500;
  c.roundRect(50, banY, W - 100, 200, 30, COL.primary);
  c.textLine(85, banY + 40, 300, 30, COL.white);
  c.textLine(85, banY + 90, 400, 15, [255, 255, 255, 200]);
  c.textLine(85, banY + 120, 380, 15, [255, 255, 255, 200]);
  c.circle(W - 130, banY + 100, 40, COL.white);
  // Popular section header
  c.textLine(50, 750, 180, 30, COL.text);
  c.textLine(W - 150, 755, 100, 20, COL.primary);
  // Two horizontal cards
  const cardY = 810;
  for (let i = 0; i < 2; i++) {
    const x = 50 + i * 340;
    c.roundRect(x, cardY, 300, 320, 30, COL.card);
    c.roundRect(x, cardY, 300, 200, 30, COL.primarySoft);
    // rating tag
    c.roundRect(x + 15, cardY + 15, 90, 40, 20, COL.white);
    c.circle(x + 30, cardY + 35, 8, COL.star);
    c.textLine(x + 45, cardY + 30, 50, 15, COL.text);
    // name + loc
    c.textLine(x + 20, cardY + 220, 240, 25, COL.text);
    c.textLine(x + 20, cardY + 260, 180, 18, COL.textMute);
    // border
    c.rect(x, cardY, 300, 1, COL.border);
    c.rect(x, cardY + 319, 300, 1, COL.border);
    c.rect(x, cardY, 1, 320, COL.border);
    c.rect(x + 299, cardY, 1, 320, COL.border);
  }
  // Nearby section header
  c.textLine(50, 1180, 170, 30, COL.text);
  c.textLine(W - 150, 1185, 100, 20, COL.primary);
  // Nearby list card
  const nearY = 1240;
  c.roundRect(50, nearY, W - 100, 140, 24, COL.card);
  c.rect(50, nearY, W - 100, 1, COL.border);
  c.rect(50, nearY + 139, W - 100, 1, COL.border);
  c.roundRect(70, nearY + 20, 100, 100, 20, COL.primarySoft);
  c.textLine(200, nearY + 30, 350, 22, COL.text);
  c.textLine(200, nearY + 65, 200, 18, COL.textMute);
  c.circle(215, nearY + 100, 8, COL.star);
  c.textLine(230, nearY + 95, 200, 15, COL.textSec);
  c.textLine(W - 130, nearY + 60, 60, 20, COL.primary);
  drawTabBar(c, 0);
  fs.writeFileSync('mockup-home.png', c.toPNG());
  console.log('mockup-home.png done');
}

// ---------- 4. CATEGORY LIST ----------
function category() {
  const c = new Canvas(W, H);
  drawStatusBar(c);
  // Header: back button, title, heart
  c.circle(80, 110, 30, COL.surface);
  c.textLine(W/2 - 60, 100, 120, 30, COL.text);
  c.circle(W - 80, 110, 30, COL.surface);
  // Search bar
  c.roundRect(50, 170, W - 100, 90, 24, COL.surface);
  c.circle(85, 215, 12, COL.textMute);
  c.textLine(115, 200, 260, 30, COL.textMute);
  // Chips row
  const chipY = 310;
  const chips = [true, false, false, false];
  let cx = 50;
  chips.forEach((active, i) => {
    const w = i === 0 ? 90 : (i === 1 ? 160 : (i === 2 ? 130 : 150));
    c.roundRect(cx, chipY, w, 50, 25, active ? COL.primary : COL.surface);
    c.textLine(cx + 20, chipY + 15, w - 40, 18, active ? COL.white : COL.textSec);
    cx += w + 15;
  });
  // Grid 2 columns x 3 rows
  const gridStartY = 400;
  const cardW = (W - 130) / 2;
  const cardH = 320;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const x = 50 + col * (cardW + 20);
      const y = gridStartY + row * (cardH + 20);
      c.roundRect(x, y, cardW, cardH, 24, COL.card);
      c.rect(x, y, cardW, 1, COL.border);
      c.rect(x, y + cardH - 1, cardW, 1, COL.border);
      c.rect(x, y, 1, cardH, COL.border);
      c.rect(x + cardW - 1, y, 1, cardH, COL.border);
      // Image
      c.roundRect(x, y, cardW, 180, 24, COL.primarySoft);
      // Heart badge
      c.circle(x + cardW - 30, y + 25, 18, [0, 0, 0, 100]);
      // Name
      c.textLine(x + 15, y + 200, cardW - 30, 22, COL.text);
      c.circle(x + 25, y + 250, 8, COL.star);
      c.textLine(x + 40, y + 245, 100, 15, COL.textSec);
      c.textLine(x + 15, y + 280, 120, 15, COL.textMute);
    }
  }
  drawTabBar(c, 0);
  fs.writeFileSync('mockup-category.png', c.toPNG());
  console.log('mockup-category.png done');
}

// ---------- 5. PLACE DETAIL ----------
function detail() {
  const c = new Canvas(W, H);
  // Hero image
  c.rect(0, 0, W, 600, COL.primarySoft);
  // Dark overlay top for readability
  for (let y = 0; y < 200; y++) {
    for (let x = 0; x < W; x++) {
      c.setPx(x, y, [0, 0, 0], Math.round((200 - y) * 0.3));
    }
  }
  // Top buttons overlay
  c.circle(80, 110, 30, [0, 0, 0, 150]);
  c.circle(W - 130, 110, 30, [0, 0, 0, 150]);
  c.circle(W - 80, 110, 30, [0, 0, 0, 150]);
  // Dots at bottom of image
  c.roundRect(W/2 - 20, 560, 40, 8, 4, COL.white);
  c.circle(W/2 + 30, 564, 4, [255, 255, 255, 150]);
  c.circle(W/2 + 50, 564, 4, [255, 255, 255, 150]);
  // Body rises up over image with rounded top corners
  c.roundRect(0, 580, W, H - 580, 40, COL.card);
  // Title
  c.textLine(50, 620, 400, 40, COL.text);
  c.circle(65, 685, 10, COL.textMute);
  c.textLine(90, 680, 200, 20, COL.textMute);
  // Price bubble right
  c.roundRect(W - 130, 620, 80, 50, 25, COL.primarySoft);
  c.textLine(W - 110, 635, 40, 20, COL.primary);
  // Price range pill
  c.roundRect(50, 730, 400, 60, 30, COL.primarySoft);
  c.circle(75, 760, 12, COL.primary);
  c.textLine(105, 750, 340, 20, COL.primary);
  // Stats row
  c.roundRect(50, 820, W - 100, 120, 24, COL.surface);
  for (let i = 0; i < 3; i++) {
    const cx = 130 + i * 200;
    c.circle(cx, 850, 12, [COL.star, COL.primary, COL.success][i]);
    c.textLine(cx - 25, 880, 50, 20, COL.text);
    c.textLine(cx - 30, 910, 60, 15, COL.textMute);
  }
  // Contact pills
  c.roundRect(50, 970, 260, 60, 30, COL.primarySoft);
  c.circle(80, 1000, 12, COL.primary);
  c.textLine(110, 990, 180, 20, COL.primary);
  c.roundRect(330, 970, 220, 60, 30, COL.primarySoft);
  c.circle(360, 1000, 12, COL.primary);
  c.textLine(390, 990, 140, 20, COL.primary);
  // About header
  c.textLine(50, 1060, 100, 25, COL.text);
  c.textLine(50, 1105, W - 100, 15, COL.textSec);
  c.textLine(50, 1130, W - 100, 15, COL.textSec);
  c.textLine(50, 1155, W - 200, 15, COL.textSec);
  // Gallery header + thumbs
  c.textLine(50, 1210, 100, 25, COL.text);
  for (let i = 0; i < 3; i++) {
    c.roundRect(50 + i * 220, 1250, 200, 130, 20, COL.primarySoft);
  }
  // Footer sticky
  c.rect(0, H - 180, W, 1, COL.border);
  c.rect(0, H - 180, W, 180, COL.card);
  c.roundRect(50, H - 150, 260, 100, 24, COL.primarySoft);
  c.circle(85, H - 100, 15, COL.primary);
  c.textLine(115, H - 110, 160, 20, COL.primary);
  c.roundRect(330, H - 150, W - 380, 100, 24, COL.primary);
  c.textLine(W/2 + 20, H - 110, 200, 20, COL.white);
  fs.writeFileSync('mockup-detail.png', c.toPNG());
  console.log('mockup-detail.png done');
}

// ---------- 6. MAP ----------
function map() {
  const c = new Canvas(W, H);
  // Map background
  c.fill([0xE8, 0xEE, 0xF4]);
  // Fake roads
  c.rect(50,   300, 500, 12, COL.white);
  c.rect(200,  500, 550, 12, COL.white);
  c.rect(100,  700, 600, 12, COL.white);
  c.rect(150,  900, 400, 12, COL.white);
  // Vertical roads
  c.rect(300,  200, 12, 600, COL.white);
  c.rect(550,  250, 12, 550, COL.white);
  // Water
  c.roundRect(500, 1000, 250, 300, 60, [0xB7, 0xD4, 0xF3]);
  // Pins (with categorical colors)
  const pins = [
    { x: 200, y: 350, c: COL.primary },
    { x: 400, y: 250, c: COL.success },
    { x: 250, y: 550, c: COL.warning },
    { x: 550, y: 700, c: COL.danger },
    { x: 350, y: 850, c: COL.accent2 },
    { x: 600, y: 400, c: COL.cyan },
  ];
  pins.forEach(pin => {
    c.circle(pin.x, pin.y, 22, [255, 255, 255]);
    c.circle(pin.x, pin.y, 18, pin.c);
  });
  // Top bar
  c.circle(80, 130, 32, COL.white);
  c.roundRect(140, 100, W - 220, 70, 35, COL.white);
  c.circle(175, 135, 12, COL.textMute);
  c.textLine(205, 125, 300, 22, COL.textMute);
  c.circle(W - 80, 130, 32, COL.white);
  // Chips row
  const chipY = 220;
  let cx = 50;
  const chipLabels = [true, false, false, false, false, false];
  chipLabels.forEach((active, i) => {
    const w = 100 + Math.floor(Math.random() * 40);
    c.roundRect(cx, chipY, w, 45, 22, active ? COL.primary : COL.white);
    c.textLine(cx + 15, chipY + 15, w - 30, 15, active ? COL.white : COL.text);
    cx += w + 12;
  });
  // Bottom card
  const cardY = H - 320;
  c.roundRect(0, cardY, W, 320, 30, COL.white);
  c.rect(0, cardY, W, 1, COL.border);
  c.roundRect(W/2 - 40, cardY + 25, 80, 10, 5, COL.border);
  // Card content: image + text + button
  c.roundRect(50, cardY + 55, 120, 120, 24, COL.primarySoft);
  c.textLine(190, cardY + 65, 280, 25, COL.text);
  c.circle(200, cardY + 115, 8, COL.star);
  c.textLine(215, cardY + 110, 220, 18, COL.textSec);
  c.circle(200, cardY + 145, 8, COL.textMute);
  c.textLine(215, cardY + 140, 200, 15, COL.textMute);
  c.circle(W - 80, cardY + 110, 30, COL.primary);
  drawTabBar(c, 1);
  fs.writeFileSync('mockup-map.png', c.toPNG());
  console.log('mockup-map.png done');
}

// ---------- 7. ITINERARY ----------
function itinerary() {
  const c = new Canvas(W, H);
  drawStatusBar(c);
  // Header
  c.circle(80, 110, 30, COL.surface);
  c.textLine(W/2 - 100, 100, 200, 30, COL.text);
  c.circle(W - 80, 110, 30, COL.surface);
  // Days row (7 days)
  const dayY = 170;
  for (let i = 0; i < 7; i++) {
    const x = 50 + i * 100;
    const active = i === 2;
    c.roundRect(x, dayY, 85, 100, 24, active ? COL.primary : COL.surface);
    c.textLine(x + 20, dayY + 20, 45, 15, active ? [255, 255, 255, 200] : COL.textSec);
    c.textLine(x + 20, dayY + 55, 45, 25, active ? COL.white : COL.text);
  }
  // Summary card
  const sumY = 310;
  c.roundRect(50, sumY, W - 100, 120, 30, COL.primary);
  c.textLine(80, sumY + 25, 260, 25, COL.white);
  c.textLine(80, sumY + 65, 240, 18, [255, 255, 255, 200]);
  c.circle(W - 100, sumY + 60, 30, [255, 255, 255, 60]);
  // Timeline activities
  const activities = [
    { color: COL.primary,  height: 130 },
    { color: COL.success,  height: 130 },
    { color: COL.warning,  height: 130 },
    { color: COL.danger,   height: 130 },
    { color: COL.accent2,  height: 130 },
  ];
  let y = 460;
  activities.forEach((act, i) => {
    // Time on left
    c.textLine(55, y + 5, 60, 15, COL.textSec);
    // Dot
    c.circle(85, y + 40, 10, act.color);
    // Line to next
    if (i < activities.length - 1) c.rect(83, y + 55, 4, 90, COL.border);
    // Card
    c.roundRect(140, y, W - 190, 120, 24, COL.card);
    c.rect(140, y, 8, 120, act.color);
    c.rect(140, y, W - 190, 1, COL.border);
    c.rect(140, y + 119, W - 190, 1, COL.border);
    c.rect(W - 51, y, 1, 120, COL.border);
    c.textLine(170, y + 20, 300, 22, COL.text);
    c.textLine(170, y + 55, 400, 18, COL.textMute);
    c.roundRect(170, y + 85, 100, 25, 12, COL.surface);
    c.circle(180, y + 97, 6, COL.textSec);
    c.textLine(195, y + 92, 60, 12, COL.textSec);
    y += 145;
  });
  drawTabBar(c, 2);
  fs.writeFileSync('mockup-itinerary.png', c.toPNG());
  console.log('mockup-itinerary.png done');
}

// ---------- 8. PROFILE ----------
function profile() {
  const c = new Canvas(W, H);
  drawStatusBar(c);
  // Header
  c.textLine(50, 100, 180, 40, COL.text);
  c.circle(W - 80, 120, 30, COL.surface);
  // Profile card
  const pY = 190;
  c.roundRect(50, pY, W - 100, 320, 30, COL.card);
  c.rect(50, pY, W - 100, 1, COL.border);
  c.rect(50, pY + 319, W - 100, 1, COL.border);
  c.circle(W/2, pY + 90, 55, COL.primary);
  c.textLine(W/2 - 90, pY + 175, 180, 25, COL.text);
  c.textLine(W/2 - 110, pY + 215, 220, 15, COL.textMute);
  c.roundRect(W/2 - 90, pY + 250, 180, 50, 25, COL.primarySoft);
  c.circle(W/2 - 55, pY + 275, 10, COL.primary);
  c.textLine(W/2 - 30, pY + 265, 110, 20, COL.primary);
  // Stats row
  const sY = 550;
  c.roundRect(50, sY, W - 100, 120, 30, COL.card);
  c.rect(50, sY, W - 100, 1, COL.border);
  c.rect(50, sY + 119, W - 100, 1, COL.border);
  for (let i = 0; i < 3; i++) {
    const cx = 130 + i * 200;
    c.textLine(cx - 20, sY + 30, 40, 25, COL.text);
    c.textLine(cx - 40, sY + 70, 80, 15, COL.textMute);
    if (i < 2) c.rect(cx + 90, sY + 20, 1, 80, COL.border);
  }
  // Appearance label
  c.textLine(50, 710, 200, 20, COL.textMute);
  // Two theme cards
  const tY = 750;
  c.roundRect(50, tY, (W - 130) / 2, 260, 24, COL.card);
  c.rect(50, tY, (W - 130) / 2, 1, COL.primary);
  c.rect(50, tY + 259, (W - 130) / 2, 1, COL.primary);
  c.rect(50, tY, 4, 260, COL.primary);
  c.rect(46 + (W - 130) / 2, tY, 4, 260, COL.primary);
  // preview inside light card
  c.roundRect(70, tY + 20, (W - 170) / 2, 140, 12, COL.white);
  c.rect(70, tY + 20, (W - 170) / 2, 1, COL.border);
  c.textLine(85, tY + 45, 150, 8, COL.text);
  c.textLine(85, tY + 65, 100, 8, COL.textMute);
  c.circle(70 + (W - 170) / 2 - 25, tY + 140, 12, COL.primary);
  // Text
  c.circle(75, tY + 195, 10, COL.primary);
  c.textLine(100, tY + 190, 100, 18, COL.primary);
  c.circle(50 + (W - 130) / 2 - 30, tY + 195, 10, COL.primary);

  // Dark card
  const dx = 90 + (W - 130) / 2;
  c.roundRect(dx, tY, (W - 130) / 2, 260, 24, COL.card);
  c.rect(dx, tY, (W - 130) / 2, 1, COL.border);
  c.rect(dx, tY + 259, (W - 130) / 2, 1, COL.border);
  c.rect(dx, tY, 4, 260, COL.border);
  c.rect(dx + (W - 130) / 2 - 4, tY, 4, 260, COL.border);
  c.roundRect(dx + 20, tY + 20, (W - 170) / 2, 140, 12, [0x0B, 0x0C, 0x14]);
  c.textLine(dx + 35, tY + 45, 150, 8, COL.white);
  c.textLine(dx + 35, tY + 65, 100, 8, COL.textMute);
  c.circle(dx + 20 + (W - 170) / 2 - 25, tY + 140, 12, [0x6D, 0x78, 0xFF]);
  c.circle(dx + 25, tY + 195, 10, COL.textSec);
  c.textLine(dx + 50, tY + 190, 100, 18, COL.textSec);

  // Settings label
  c.textLine(50, 1060, 150, 20, COL.textMute);
  // Settings card with 3 rows
  const setY = 1100;
  c.roundRect(50, setY, W - 100, 240, 30, COL.card);
  c.rect(50, setY, W - 100, 1, COL.border);
  c.rect(50, setY + 239, W - 100, 1, COL.border);
  for (let i = 0; i < 3; i++) {
    const rowY = setY + 20 + i * 75;
    c.circle(90, rowY + 25, 12, COL.primary);
    c.textLine(120, rowY + 15, 200, 22, COL.text);
    if (i === 1) c.textLine(W - 200, rowY + 20, 100, 18, COL.textMute);
    if (i === 2) c.textLine(W - 180, rowY + 20, 80, 18, COL.textMute);
    c.textLine(W - 90, rowY + 22, 15, 15, COL.textMute);
    if (i < 2) c.rect(90, rowY + 60, W - 180, 1, COL.border);
  }
  drawTabBar(c, 3);
  fs.writeFileSync('mockup-profile.png', c.toPNG());
  console.log('mockup-profile.png done');
}

// Generate all
splash();
onboarding();
home();
category();
detail();
map();
itinerary();
profile();
console.log('All mockups generated.');
