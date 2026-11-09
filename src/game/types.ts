/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type DessertType =
  | 'souffle_pancake'
  | 'strawberry_shortcake'
  | 'matcha_millefeuille'
  | 'macaron_pink'
  | 'macaron_mint'
  | 'caramel_pudding'
  | 'blueberry_tart'
  | 'chocolate_roll';

export type ItemType = 'golden_cherry' | 'slow_clock' | 'sugar_shield';

export interface DessertItem {
  type: ItemType;
  name: string;
  icon: string;
  color: string;
  desc: string;
}

export const DESSERT_ITEMS: Record<ItemType, DessertItem> = {
  golden_cherry: {
    type: 'golden_cherry',
    name: '金色櫻桃',
    icon: '🍒',
    color: '#F59E0B',
    desc: '寬度大幅回補 +24px！',
  },
  slow_clock: {
    type: 'slow_clock',
    name: '焦糖時鐘',
    icon: '⏰',
    color: '#06B6D4',
    desc: '擺鐘慢速對時 5 秒！',
  },
  sugar_shield: {
    type: 'sugar_shield',
    name: '保命護盾',
    icon: '🛡️',
    color: '#EA580C',
    desc: '抵消一次墜落致命失誤！',
  },
};

export interface ActiveBuffs {
  shieldCount: number;
  slowMoCharges: number;
  lastCollectedItem: DessertItem | null;
}

export interface Block {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: DessertType;
  colorSeed: number;
  isBase?: boolean;
  isPerfect?: boolean;
  creamDripSide?: 'left' | 'right' | null;
  item?: DessertItem | null;
  itemSpawnTime?: number;
  showItemIntro?: boolean;
}

export interface FallingBlock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: DessertType;
  colorSeed: number;
  item?: DessertItem | null;
}

export interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  vRot: number;
  type: DessertType;
  colorSeed: number;
  isRightSide: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  rotation: number;
  vRot: number;
  shape: 'circle' | 'star' | 'heart' | 'sparkle' | 'cream' | 'confetti';
  width?: number;
  height?: number;
  isCream?: boolean;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  subText?: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export const MILESTONE_TITLES: Record<number, string> = {
  10: '初級烘焙學徒',
  20: '法式甜品心匠',
  30: '舒芙蕾名家',
  40: '特級甜點大師',
  50: '米其林三星甜點神',
  60: '傳奇甜點之巔',
};
