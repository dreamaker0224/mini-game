/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DessertType } from './types';

export const DESSERT_LIST: DessertType[] = [
  'souffle_pancake',
  'strawberry_shortcake',
  'caramel_pudding',
  'macaron_pink',
  'matcha_millefeuille',
  'macaron_mint',
  'chocolate_roll',
  'blueberry_tart',
];

export const DESSERT_NAMES: Record<DessertType, string> = {
  souffle_pancake: '舒芙蕾鬆餅',
  strawberry_shortcake: '草莓鮮奶油蛋糕',
  caramel_pudding: '昭和焦糖布丁',
  macaron_pink: '白桃櫻花馬卡龍',
  matcha_millefeuille: '宇治抹茶千層派',
  macaron_mint: '薄荷開心果馬卡龍',
  chocolate_roll: '生黑巧生乳捲',
  blueberry_tart: '糖霜藍莓塔',
};

// Helper: draw rounded rectangle
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  r = Math.max(0, r);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draw the foundational dessert plate / silver pedestal
 */
export function drawBasePlate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.save();

  // Shadow under plate
  ctx.fillStyle = 'rgba(40, 20, 20, 0.15)';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height + 6, width / 2 + 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Plate base rim (gold rim)
  const plateGrad = ctx.createLinearGradient(x, y, x + width, y + height);
  plateGrad.addColorStop(0, '#FFF9EB');
  plateGrad.addColorStop(0.5, '#FFF2D6');
  plateGrad.addColorStop(1, '#FFE4B5');

  drawRoundRect(ctx, x - 8, y + 6, width + 16, height - 2, 8);
  ctx.fillStyle = plateGrad;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#E8BD70';
  ctx.stroke();

  // Porcelain inner plate
  const innerGrad = ctx.createLinearGradient(x, y, x, y + height);
  innerGrad.addColorStop(0, '#FFFFFF');
  innerGrad.addColorStop(1, '#F3EDE4');
  drawRoundRect(ctx, x - 4, y, width + 8, height - 6, 6);
  ctx.fillStyle = innerGrad;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#D9C8B0';
  ctx.stroke();

  // Cute gold scallop line
  ctx.strokeStyle = '#F0C975';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const step = 14;
  for (let px = x; px < x + width; px += step) {
    ctx.arc(px + step / 2, y + 4, step / 3, Math.PI, 0, true);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * Master drawing function for dessert blocks
 */
export function drawDessertBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  type: DessertType,
  _colorSeed: number = 0,
  isSquashed: boolean = false
) {
  if (width <= 0 || height <= 0) return;

  ctx.save();

  // Squash & Stretch bounce effect when hitting
  if (isSquashed) {
    ctx.translate(x + width / 2, y + height);
    ctx.scale(1.04, 0.94);
    ctx.translate(-(x + width / 2), -(y + height));
  }

  // Soft drop shadow under the block
  ctx.fillStyle = 'rgba(45, 20, 15, 0.12)';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height + 2, width / 2 - 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (type) {
    case 'souffle_pancake':
      drawSoufflePancake(ctx, x, y, width, height);
      break;
    case 'strawberry_shortcake':
      drawStrawberryShortcake(ctx, x, y, width, height);
      break;
    case 'caramel_pudding':
      drawCaramelPudding(ctx, x, y, width, height);
      break;
    case 'macaron_pink':
      drawMacaron(ctx, x, y, width, height, '#FF9AA2', '#FFB7B2', '#FFE4E6');
      break;
    case 'macaron_mint':
      drawMacaron(ctx, x, y, width, height, '#A7D7C5', '#C8E6C9', '#E8F5E9');
      break;
    case 'matcha_millefeuille':
      drawMatchaMillefeuille(ctx, x, y, width, height);
      break;
    case 'chocolate_roll':
      drawChocolateRoll(ctx, x, y, width, height);
      break;
    case 'blueberry_tart':
      drawBlueberryTart(ctx, x, y, width, height);
      break;
  }

  ctx.restore();
}

/**
 * 1. Souffle Pancake (舒芙蕾厚鬆餅)
 */
function drawSoufflePancake(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Golden fluffy pancake body
  const bodyGrad = ctx.createLinearGradient(x, y, x, y + h);
  bodyGrad.addColorStop(0, '#FFE8A3');
  bodyGrad.addColorStop(0.3, '#FED177');
  bodyGrad.addColorStop(1, '#E9A64B');

  drawRoundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Subtle golden crust border
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#D9822B';
  ctx.stroke();

  // Fluffy air bubble textures
  if (w > 20) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(x + w * 0.25, y + h * 0.4, 2.5, 0, Math.PI * 2);
    ctx.arc(x + w * 0.75, y + h * 0.6, 2, 0, Math.PI * 2);
    ctx.arc(x + w * 0.5, y + h * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dripping maple syrup over top
  ctx.fillStyle = 'rgba(189, 107, 34, 0.75)';
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 1);
  const waveCount = Math.max(2, Math.floor(w / 18));
  const step = w / waveCount;
  for (let i = 0; i < waveCount; i++) {
    const curX = x + i * step;
    const midX = curX + step / 2;
    const endX = curX + step;
    const dropDepth = (i % 2 === 0 ? 8 : 4) * Math.min(1, h / 30);
    ctx.quadraticCurveTo(midX, y + dropDepth, endX, y + 1);
  }
  ctx.lineTo(x + w - 2, y);
  ctx.lineTo(x + 2, y);
  ctx.closePath();
  ctx.fill();

  // Butter square on top center
  if (w > 28 && h > 20) {
    const butterSize = Math.min(14, w * 0.25);
    const bx = x + w / 2 - butterSize / 2;
    const by = y - 4;

    ctx.fillStyle = '#FFE66D';
    drawRoundRect(ctx, bx, by, butterSize, butterSize * 0.75, 2);
    ctx.fill();
    ctx.strokeStyle = '#F4B400';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Butter melting shine
    ctx.fillStyle = '#FFF9D2';
    ctx.fillRect(bx + 2, by + 1, butterSize * 0.4, 2);
  }
}

/**
 * 2. Strawberry Shortcake (日式草莓鮮奶油蛋糕)
 */
function drawStrawberryShortcake(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Sponge bottom
  const spongeGrad = ctx.createLinearGradient(x, y, x, y + h);
  spongeGrad.addColorStop(0, '#FFF5D6');
  spongeGrad.addColorStop(0.5, '#FFEBB5');
  spongeGrad.addColorStop(1, '#F7D692');

  drawRoundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = spongeGrad;
  ctx.fill();
  ctx.strokeStyle = '#E0B56A';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Middle strawberry jam & cream layer
  const creamY = y + h * 0.45;
  const creamH = h * 0.22;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + 1, creamY, w - 2, creamH);

  // Jam dots
  if (w > 20) {
    ctx.fillStyle = '#FF4D6D';
    const dotCount = Math.max(1, Math.floor(w / 22));
    const step = w / (dotCount + 1);
    for (let i = 1; i <= dotCount; i++) {
      ctx.beginPath();
      ctx.arc(x + i * step, creamY + creamH / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Top whipped cream swirls
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  const swirlCount = Math.max(2, Math.floor(w / 16));
  const swStep = w / swirlCount;
  for (let i = 0; i < swirlCount; i++) {
    const sx = x + i * swStep;
    ctx.arc(sx + swStep / 2, y + 1, swStep / 2.2, Math.PI, 0, false);
  }
  ctx.fill();

  // Strawberry slice on top
  if (w > 24) {
    const sbW = Math.min(16, w * 0.3);
    const sbH = Math.min(14, h * 0.55);
    const sbX = x + w / 2 - sbW / 2;
    const sbY = y - sbH * 0.65;

    // Red strawberry body
    ctx.fillStyle = '#FF2E55';
    ctx.beginPath();
    ctx.moveTo(sbX + sbW / 2, sbY + sbH);
    ctx.bezierCurveTo(sbX, sbY + sbH * 0.7, sbX, sbY, sbX + sbW / 2, sbY);
    ctx.bezierCurveTo(sbX + sbW, sbY, sbX + sbW, sbY + sbH * 0.7, sbX + sbW / 2, sbY + sbH);
    ctx.fill();

    // Little yellow strawberry seeds
    ctx.fillStyle = '#FFDD55';
    ctx.beginPath();
    ctx.arc(sbX + sbW * 0.35, sbY + sbH * 0.5, 1, 0, Math.PI * 2);
    ctx.arc(sbX + sbW * 0.65, sbY + sbH * 0.5, 1, 0, Math.PI * 2);
    ctx.arc(sbX + sbW * 0.5, sbY + sbH * 0.75, 1, 0, Math.PI * 2);
    ctx.fill();

    // Green leaf calyx
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.moveTo(sbX + sbW / 2, sbY - 1);
    ctx.lineTo(sbX + sbW * 0.2, sbY + 2);
    ctx.lineTo(sbX + sbW / 2, sbY + 1);
    ctx.lineTo(sbX + sbW * 0.8, sbY + 2);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * 3. Caramel Purin (昭和焦糖布丁)
 */
function drawCaramelPudding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Trapezoid / rounded custard body
  const custardGrad = ctx.createLinearGradient(x, y, x, y + h);
  custardGrad.addColorStop(0, '#FFF1AA');
  custardGrad.addColorStop(0.6, '#FFE57F');
  custardGrad.addColorStop(1, '#FFCA28');

  drawRoundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = custardGrad;
  ctx.fill();
  ctx.strokeStyle = '#F57F17';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Dark amber caramel top
  const caramelGrad = ctx.createLinearGradient(x, y, x, y + h * 0.4);
  caramelGrad.addColorStop(0, '#5D2E14');
  caramelGrad.addColorStop(0.7, '#8D4016');
  caramelGrad.addColorStop(1, '#B25018');

  ctx.fillStyle = caramelGrad;
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.arcTo(x, y, x + 6, y, 6);
  ctx.arcTo(x + w, y, x + w, y + 6, 6);
  ctx.lineTo(x + w, y + h * 0.28);

  // Dripping caramel drips down side
  const dripCount = Math.max(2, Math.floor(w / 18));
  const step = w / dripCount;
  for (let i = dripCount - 1; i >= 0; i--) {
    const curX = x + i * step;
    const dripLen = (i % 2 === 0 ? 10 : 5) * Math.min(1, h / 28);
    ctx.quadraticCurveTo(curX + step / 2, y + h * 0.28 + dripLen, curX, y + h * 0.28);
  }
  ctx.closePath();
  ctx.fill();

  // Glossy caramel highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(x + w * 0.2, y + 2, w * 0.35, 2);

  // Red glazed cherry on top
  if (w > 26) {
    const cherryX = x + w / 2;
    const cherryY = y - 4;
    const cherryR = Math.min(6, w * 0.12);

    ctx.fillStyle = '#D50000';
    ctx.beginPath();
    ctx.arc(cherryX, cherryY, cherryR, 0, Math.PI * 2);
    ctx.fill();

    // Cherry gloss
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cherryX - 2, cherryY - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Cherry stem
    ctx.strokeStyle = '#4E342E';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cherryX, cherryY - cherryR + 1);
    ctx.quadraticCurveTo(cherryX + 4, cherryY - cherryR - 8, cherryX + 8, cherryY - cherryR - 6);
    ctx.stroke();
  }
}

/**
 * 4. Macaron (法式馬卡龍)
 */
function drawMacaron(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  shellColor: string,
  shellHighlight: string,
  creamColor: string
) {
  const shellH = h * 0.38;
  const creamH = h * 0.24;

  // Top shell
  const topGrad = ctx.createLinearGradient(x, y, x, y + shellH);
  topGrad.addColorStop(0, shellHighlight);
  topGrad.addColorStop(1, shellColor);

  drawRoundRect(ctx, x, y, w, shellH, 8);
  ctx.fillStyle = topGrad;
  ctx.fill();

  // Ruffled feet (pied) for top shell
  ctx.fillStyle = shellColor;
  ctx.fillRect(x + 1, y + shellH - 3, w - 2, 3);

  // Cream filling
  drawRoundRect(ctx, x + 2, y + shellH - 1, w - 4, creamH + 2, 3);
  ctx.fillStyle = creamColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.stroke();

  // Bottom shell
  const botGrad = ctx.createLinearGradient(x, y + shellH + creamH, x, y + h);
  botGrad.addColorStop(0, shellColor);
  botGrad.addColorStop(1, shellHighlight);

  drawRoundRect(ctx, x, y + shellH + creamH - 1, w, shellH, 8);
  ctx.fillStyle = botGrad;
  ctx.fill();

  // Shell gloss line
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 4, Math.max(2, w * 0.35), 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 5. Matcha Mille-feuille (宇治抹茶千層派)
 */
function drawMatchaMillefeuille(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Base body: alternating layers of pastry & rich matcha cream
  drawRoundRect(ctx, x, y, w, h, 4);
  ctx.fillStyle = '#6E8E38';
  ctx.fill();

  const layerCount = 5;
  const lH = h / layerCount;
  for (let i = 0; i < layerCount; i++) {
    const ly = y + i * lH;
    if (i % 2 === 0) {
      // Golden puff pastry crust
      ctx.fillStyle = '#D9A758';
      ctx.fillRect(x + 1, ly, w - 2, lH);
    } else {
      // Vivid matcha ganache
      ctx.fillStyle = '#557A27';
      ctx.fillRect(x + 1, ly, w - 2, lH);
    }
  }

  // Top layer dusting of dark matcha powder
  ctx.fillStyle = '#3F5D18';
  ctx.fillRect(x, y, w, 3);

  // White whipped cream drop & gold leaf flake
  if (w > 20) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x + w * 0.35, y - 2, 4, 0, Math.PI * 2);
    ctx.arc(x + w * 0.65, y - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Gold leaf fleck
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + w * 0.5 - 2, y - 3, 4, 3);
  }

  ctx.strokeStyle = '#405B1B';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, x, y, w, h, 4);
  ctx.stroke();
}

/**
 * 6. Chocolate Roll Cake (生黑巧生乳捲)
 */
function drawChocolateRoll(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Rich cocoa sponge
  const chocoGrad = ctx.createLinearGradient(x, y, x, y + h);
  chocoGrad.addColorStop(0, '#5A3525');
  chocoGrad.addColorStop(0.5, '#432619');
  chocoGrad.addColorStop(1, '#2E190E');

  drawRoundRect(ctx, x, y, w, h, 7);
  ctx.fillStyle = chocoGrad;
  ctx.fill();

  // Cream swirl inside
  if (w > 24) {
    ctx.strokeStyle = '#FFFDD0';
    ctx.lineWidth = Math.min(4, h * 0.2);
    ctx.beginPath();
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.arc(cx, cy, Math.min(10, h * 0.3), 0, Math.PI * 1.5);
    ctx.stroke();
  }

  // Dusted cocoa glaze & chocolate shard on top
  ctx.fillStyle = '#241208';
  ctx.fillRect(x + 2, y, w - 4, 2.5);

  if (w > 26) {
    // Elegant dark chocolate curl
    ctx.fillStyle = '#1C0D06';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.35, y - 1);
    ctx.quadraticCurveTo(x + w * 0.5, y - 7, x + w * 0.65, y - 1);
    ctx.lineTo(x + w * 0.6, y - 1);
    ctx.quadraticCurveTo(x + w * 0.5, y - 5, x + w * 0.4, y - 1);
    ctx.closePath();
    ctx.fill();
  }

  ctx.strokeStyle = '#2A170C';
  ctx.lineWidth = 1;
  drawRoundRect(ctx, x, y, w, h, 7);
  ctx.stroke();
}

/**
 * 7. Blueberry Tart (糖霜藍莓塔)
 */
function drawBlueberryTart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Baked pastry crust
  const crustGrad = ctx.createLinearGradient(x, y, x, y + h);
  crustGrad.addColorStop(0, '#F5C678');
  crustGrad.addColorStop(1, '#C88A34');

  drawRoundRect(ctx, x, y + h * 0.3, w, h * 0.7, 5);
  ctx.fillStyle = crustGrad;
  ctx.fill();

  // Scalloped crust ridge
  ctx.strokeStyle = '#AB6E1B';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Purple blueberry compote filling
  ctx.fillStyle = '#4A154B';
  ctx.fillRect(x + 2, y + h * 0.3, w - 4, h * 0.3);

  // Plump round blueberries on top
  const berryCount = Math.max(2, Math.floor(w / 14));
  const step = w / berryCount;
  for (let i = 0; i < berryCount; i++) {
    const bx = x + i * step + step / 2;
    const by = y + h * 0.2;
    const br = Math.min(6, step * 0.45);

    // Deep indigo blueberry
    const bGrad = ctx.createRadialGradient(bx - 1, by - 1, 1, bx, by, br);
    bGrad.addColorStop(0, '#5B68A4');
    bGrad.addColorStop(0.6, '#282F6B');
    bGrad.addColorStop(1, '#1A1D47');

    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();

    // Little white wax bloom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(bx - 1.5, by - 1.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Little green mint leaf
  if (w > 28) {
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    const mx = x + w * 0.7;
    const my = y + 2;
    ctx.ellipse(mx, my, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
