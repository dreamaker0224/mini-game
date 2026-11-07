/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER';

export type DessertType =
  | 'souffle_pancake'
  | 'strawberry_shortcake'
  | 'matcha_millefeuille'
  | 'macaron_pink'
  | 'macaron_mint'
  | 'caramel_pudding'
  | 'blueberry_tart'
  | 'chocolate_roll';

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
  shape: 'circle' | 'star' | 'heart' | 'sparkle';
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
