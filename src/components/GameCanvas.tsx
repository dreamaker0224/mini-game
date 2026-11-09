/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Block,
  Debris,
  DessertType,
  FallingBlock,
  FloatingText,
  Particle,
  MILESTONE_TITLES,
  DessertItem,
  DESSERT_ITEMS,
  ItemType,
  ActiveBuffs,
} from '../game/types';
import { DESSERT_LIST, drawBasePlate, drawDessertBlock, drawRoundRect } from '../game/desserts';
import { sound } from '../game/audio';

interface GameCanvasProps {
  isPlaying: boolean;
  isPaused?: boolean;
  onGameOver: (finalScore: number, maxCombo: number) => void;
  onScoreUpdate: (
    score: number,
    combo: number,
    speedMultiplier: number,
    isFever: boolean,
    milestoneTitle: string | null,
    activeBuffs: ActiveBuffs,
    incomingItem: DessertItem | null
  ) => void;
  onNewGameSignal: number; // Increment to reset
}

const INITIAL_WIDTH = 180;
const BLOCK_HEIGHT = 28;
const BASE_ARM_LENGTH = 160;
const GRAVITY = 1600;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  isPlaying,
  isPaused = false,
  onGameOver,
  onScoreUpdate,
  onNewGameSignal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game internal mutable state (kept in ref so 60fps loop is fully isolated)
  const stateRef = useRef<{
    score: number;
    combo: number;
    maxCombo: number;
    blocks: Block[];
    falling: FallingBlock | null;
    debris: Debris[];
    particles: Particle[];
    floatingTexts: FloatingText[];
    cameraY: number;
    targetCameraY: number;
    currentWidth: number;
    swingAngle: number;
    swingPhase: number;
    nextDessertType: DessertType;
    nextColorSeed: number;
    nextItem: DessertItem | null;
    fallingItem: DessertItem | null;
    layersUntilNextItem: number;
    activeShield: number;
    slowMoCharges: number;
    isDropping: boolean;
    gameOver: boolean;
    squashTimer: number;
    screenShake: number;
    lastFrameTime: number;
    textIdCounter: number;
    seenInRun: Set<ItemType>;
    width: number;
    height: number;
  }>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    blocks: [],
    falling: null,
    debris: [],
    particles: [],
    floatingTexts: [],
    cameraY: 0,
    targetCameraY: 0,
    currentWidth: INITIAL_WIDTH,
    swingAngle: 0,
    swingPhase: 0,
    nextDessertType: 'souffle_pancake',
    nextColorSeed: 0,
    nextItem: null,
    fallingItem: null,
    layersUntilNextItem: 3,
    activeShield: 0,
    slowMoCharges: 0,
    isDropping: false,
    gameOver: false,
    squashTimer: 0,
    screenShake: 0,
    lastFrameTime: 0,
    textIdCounter: 0,
    seenInRun: new Set<ItemType>(),
    width: 400,
    height: 700,
  });

  // Initialize a fresh game
  const initGame = useCallback(() => {
    const s = stateRef.current;
    const cw = s.width || 400;
    const ch = s.height || 700;

    const baseWidth = INITIAL_WIDTH;
    const baseX = (cw - baseWidth) / 2;
    const baseY = ch - 120;

    try {
      localStorage.removeItem('sweet_stacker_seen_items');
    } catch {}

    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.currentWidth = baseWidth;
    s.seenInRun = new Set<ItemType>();
    s.blocks = [
      {
        id: 0,
        x: baseX,
        y: baseY,
        width: baseWidth,
        height: BLOCK_HEIGHT + 4,
        type: 'souffle_pancake',
        colorSeed: 0,
        isBase: true,
      },
    ];
    s.falling = null;
    s.debris = [];
    s.particles = [];
    s.floatingTexts = [];
    s.cameraY = 0;
    s.targetCameraY = 0;
    s.swingAngle = 0;
    s.swingPhase = 0;
    s.nextDessertType = DESSERT_LIST[1];
    s.nextColorSeed = 1;
    s.nextItem = null;
    s.fallingItem = null;
    s.layersUntilNextItem = 2;
    s.activeShield = 0;
    s.slowMoCharges = 0;
    s.isDropping = false;
    s.gameOver = false;
    s.squashTimer = 0;
    s.screenShake = 0;
    s.lastFrameTime = performance.now();

    onScoreUpdate(
      0,
      0,
      1.0,
      false,
      null,
      { shieldCount: 0, slowMoCharges: 0, lastCollectedItem: null },
      null
    );
  }, [onScoreUpdate]);

  // Handle Drop Action (tap/click/space)
  const handleDrop = useCallback(() => {
    const s = stateRef.current;
    if (!isPlaying || isPaused || s.gameOver || s.isDropping || s.falling) return;

    const cw = s.width;
    const pivotX = cw / 2;
    const pivotY = s.cameraY + 50;

    // Current suspended dessert coordinates
    const curTheta = s.swingAngle;
    const armLen = BASE_ARM_LENGTH;
    const dessertX = pivotX + armLen * Math.sin(curTheta) - s.currentWidth / 2;
    const dessertY = pivotY + armLen * Math.cos(curTheta) - BLOCK_HEIGHT / 2;

    // Straight vertical drop (pendulum does not hold item; item sits on cake below)
    s.falling = {
      x: dessertX,
      y: dessertY,
      vx: 0, // Direct straight down drop
      vy: 180,
      width: s.currentWidth,
      height: BLOCK_HEIGHT,
      type: s.nextDessertType,
      colorSeed: s.nextColorSeed,
    };

    s.isDropping = true;
    sound.playDrop();

    // Prepare next dessert in line
    const nextIdx = (s.score + 2) % DESSERT_LIST.length;
    s.nextDessertType = DESSERT_LIST[nextIdx];
    s.nextColorSeed = s.score + 2;

    if (s.slowMoCharges > 0) {
      s.slowMoCharges -= 1;
    }

    const currentTopItem = s.blocks[s.blocks.length - 1]?.item || null;

    onScoreUpdate(
      s.score,
      s.combo,
      s.slowMoCharges > 0 ? 0.65 : 1.0,
      s.combo >= 3,
      null,
      {
        shieldCount: s.activeShield,
        slowMoCharges: s.slowMoCharges,
        lastCollectedItem: null,
      },
      currentTopItem
    );
  }, [isPlaying, isPaused, onScoreUpdate]);

  // Reset when signal changes
  useEffect(() => {
    initGame();
  }, [onNewGameSignal, initGame]);

  // Main 60fps game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stateRef.current.width = rect.width;
      stateRef.current.height = rect.height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const loop = (timestamp: number) => {
      const s = stateRef.current;
      const rawDt = (timestamp - (s.lastFrameTime || timestamp)) / 1000;
      const dt = Math.min(rawDt, 0.05); // Clamp frame delta time
      s.lastFrameTime = timestamp;

      const cw = s.width || 400;
      const ch = s.height || 700;

      if (isPaused) {
        renderScene(ctx, s, cw, ch);
        animId = requestAnimationFrame(loop);
        return;
      }

      // 1. UPDATE LOGIC
      if (isPlaying && !s.gameOver) {
        // Comfortable swing speed (slowed down if slowMoCharges active)
        const baseSwingSpeed = 2.5;
        const swingSpeed = s.slowMoCharges > 0 ? baseSwingSpeed * 0.65 : baseSwingSpeed;
        s.swingPhase += swingSpeed * dt;
        const maxAngle = 0.65; // ~37 degrees
        s.swingAngle = maxAngle * Math.sin(s.swingPhase);

        // Update Falling Block
        if (s.falling) {
          s.falling.vy += GRAVITY * dt;
          s.falling.y += s.falling.vy * dt;
          s.falling.x += s.falling.vx * dt;

          const topBlock = s.blocks[s.blocks.length - 1];
          const targetY = topBlock.y - BLOCK_HEIGHT;

          // Check if falling block reached or passed the target surface
          if (s.falling.y >= targetY) {
            // Collision & Overlap Evaluation
            const dropLeft = s.falling.x;
            const dropRight = s.falling.x + s.falling.width;
            const targetLeft = topBlock.x;
            const targetRight = topBlock.x + topBlock.width;

            const overlapLeft = Math.max(dropLeft, targetLeft);
            const overlapRight = Math.min(dropRight, targetRight);
            const overlapWidth = overlapRight - overlapLeft;

            if (overlapWidth <= 0) {
              // Missed completely! Check if shield can save the player from falling
              if (s.activeShield > 0) {
                s.activeShield -= 1;
                sound.playShieldBreak();
                spawnShieldAbsorbParticles(targetLeft + topBlock.width / 2, targetY);
                s.screenShake = 8;

                // Safely snap block onto top of the tower!
                const finalX = targetLeft;
                const finalWidth = topBlock.width;
                s.combo = 0;

                addFloatingText(
                  finalX + finalWidth / 2,
                  targetY - 36,
                  '🛡️ 護盾粉碎！救回致命一命！',
                  '#EA580C'
                );

                const pointsEarned = 1;
                const oldScore = s.score;
                s.score += pointsEarned;
                s.squashTimer = 0.15;

                s.blocks.push({
                  id: s.score,
                  x: finalX,
                  y: targetY,
                  width: finalWidth,
                  height: BLOCK_HEIGHT,
                  type: s.falling.type,
                  colorSeed: s.falling.colorSeed,
                  isPerfect: false,
                  creamDripSide: null,
                });

                // Milestone check: every 10 tiers
                const oldTier = Math.floor(oldScore / 10);
                const newTier = Math.floor(s.score / 10);
                let currentMilestoneTitle: string | null = null;
                if (newTier > oldTier && s.score >= 10) {
                  const tierLevel = newTier * 10;
                  currentMilestoneTitle = MILESTONE_TITLES[tierLevel] || '傳奇甜點之巔';
                  sound.playMilestone();
                  spawnMilestoneConfetti(cw, s.cameraY);
                  addFloatingText(cw / 2, s.cameraY + ch * 0.35, `🏆 解鎖稱號【${currentMilestoneTitle}】!`, '#F59E0B');
                  s.screenShake = 6;
                }

                s.targetCameraY = Math.min(0, targetY - ch * 0.62);

                onScoreUpdate(
                  s.score,
                  s.combo,
                  s.slowMoCharges > 0 ? 0.65 : 1.0,
                  false,
                  currentMilestoneTitle,
                  {
                    shieldCount: s.activeShield,
                    slowMoCharges: s.slowMoCharges,
                    lastCollectedItem: null,
                  },
                  s.nextItem
                );

                s.falling = null;
                s.fallingItem = null;
                s.isDropping = false;
              } else {
                // Missed completely! Falls to doom with rotating tumbling physics
                s.gameOver = true;
                sound.playGameOver();
                s.screenShake = 12;

                const isRightMiss = dropLeft >= targetRight;
                const missVx = isRightMiss ? 70 + Math.random() * 40 : -(70 + Math.random() * 40);
                const missVRot = isRightMiss ? 4.5 + Math.random() * 2 : -(4.5 + Math.random() * 2);

                // Convert entire missed block into tumbling debris that plummets off-screen
                s.debris.push({
                  x: s.falling.x,
                  y: s.falling.y,
                  vx: missVx,
                  vy: s.falling.vy * 0.4 - 40,
                  width: s.falling.width,
                  height: s.falling.height,
                  rotation: 0,
                  vRot: missVRot,
                  type: s.falling.type,
                  colorSeed: s.falling.colorSeed,
                  isRightSide: isRightMiss,
                });

                // Spawn miss poof particles
                spawnItemMissParticles(s.falling.x + s.falling.width / 2, s.falling.y + s.falling.height / 2);

                // Immediately clear falling state so the block doesn't freeze in mid-air
                s.falling = null;
                s.fallingItem = null;
                s.isDropping = false;

                // Wait ~0.8s for block to tumble off-screen before opening game over modal
                setTimeout(() => {
                  onGameOver(s.score, s.maxCombo);
                }, 800);
              }
            } else {
              // Hit the tower!
              const centerDiff = (dropLeft + dropRight) / 2 - (targetLeft + targetRight) / 2;
              const isPerfect = Math.abs(centerDiff) <= 4.5;
              const targetItem = topBlock.item;

              let finalX: number;
              let finalWidth: number;
              let sliceSide: 'left' | 'right' | null = null;

              if (isPerfect) {
                // Perfect Snap!
                finalX = targetLeft;
                finalWidth = topBlock.width;
                s.combo += 1;
                s.maxCombo = Math.max(s.maxCombo, s.combo);

                const isFever = s.combo >= 3;

                // Check Item Collection on Perfect Landing on top of stacked cake!
                if (targetItem) {
                  sound.playItemCollect();
                  spawnItemCollectParticles(finalX + finalWidth / 2, targetY, targetItem.color);
                  addFloatingText(
                    finalX + finalWidth / 2,
                    targetY - 48,
                    `✨ 完美疊中！獲得【${targetItem.name}】!`,
                    targetItem.color
                  );

                  // Execute item effects
                  if (targetItem.type === 'golden_cherry') {
                    const expandAmt = 24;
                    s.currentWidth = Math.min(INITIAL_WIDTH, s.currentWidth + expandAmt);
                    finalWidth = s.currentWidth;
                    finalX = Math.max(10, targetLeft - (finalWidth - topBlock.width) / 2);
                    sound.playRecover();
                    spawnRecoverParticles(finalX + finalWidth / 2, targetY);
                    addFloatingText(finalX + finalWidth / 2, targetY - 72, '🍒 金色櫻桃！大幅回補 +24px!', '#F59E0B');
                  } else if (targetItem.type === 'slow_clock') {
                    s.slowMoCharges = 5;
                    sound.playClockTick();
                    addFloatingText(finalX + finalWidth / 2, targetY - 72, '⏰ 焦糖時鐘！慢速5次擺動', '#06B6D4');
                  } else if (targetItem.type === 'sugar_shield') {
                    s.activeShield = 1;
                    sound.playShieldProtect();
                    addFloatingText(finalX + finalWidth / 2, targetY - 72, '🛡️ 保命護盾就緒！抵擋失誤', '#EA580C');
                  }
                  topBlock.item = null;
                }

                // Width Recovery starts at COMBO >= 2!
                if (s.combo >= 2 && s.currentWidth < INITIAL_WIDTH) {
                  const recoveryAmount = Math.min(INITIAL_WIDTH - s.currentWidth, 8);
                  s.currentWidth += recoveryAmount;
                  finalWidth = s.currentWidth;
                  finalX = Math.max(10, finalX - recoveryAmount / 2);

                  sound.playRecover();
                  spawnRecoverParticles(finalX + finalWidth / 2, targetY);
                  addFloatingText(
                    finalX + finalWidth / 2,
                    targetY - 26,
                    `+ 寬度回補 (+${recoveryAmount}px)!`,
                    '#10B981'
                  );
                }

                if (isFever) {
                  sound.playFeverLand(s.combo);
                  addFloatingText(
                    finalX + finalWidth / 2,
                    targetY - 10,
                    `⚡ FEVER x${s.combo}! +2pt`,
                    '#EC4899'
                  );
                } else {
                  sound.playLand(s.combo, true);
                  addFloatingText(
                    finalX + finalWidth / 2,
                    targetY - 10,
                    s.combo > 1 ? `PERFECT x${s.combo}!` : 'PERFECT!',
                    '#F59E0B'
                  );
                }

                // Add Sparkles
                spawnPerfectParticles(finalX + finalWidth / 2, targetY);
                s.screenShake = 4;
              } else {
                // Not Perfect: Check Caramel Shield first!
                if (s.activeShield > 0) {
                  s.activeShield -= 1;
                  sound.playShieldProtect();
                  spawnShieldAbsorbParticles(targetLeft + topBlock.width / 2, targetY);

                  // Shield absorbs the slice: keep full width intact!
                  finalX = targetLeft;
                  finalWidth = topBlock.width;
                  s.combo = 0;
                  s.screenShake = 2;

                  addFloatingText(
                    finalX + finalWidth / 2,
                    targetY - 26,
                    '🛡️ 糖霜護盾生效！抵擋裁切！',
                    '#EA580C'
                  );
                } else {
                  // Normal slice mechanic: excess is trimmed
                  s.combo = 0;
                  finalX = overlapLeft;
                  finalWidth = overlapWidth;
                  s.currentWidth = finalWidth;

                  sound.playSlice();
                  sound.playLand(0, false);
                  s.screenShake = 3;

                  const isLeftSlice = dropLeft < targetLeft;
                  sliceSide = isLeftSlice ? 'left' : 'right';
                  const debrisW = isLeftSlice ? targetLeft - dropLeft : dropRight - targetRight;
                  const debrisX = isLeftSlice ? dropLeft : targetRight;
                  const vx = isLeftSlice ? -(120 + Math.random() * 40) : (120 + Math.random() * 40);
                  const vRot = isLeftSlice ? -(7 + Math.random() * 4) : (7 + Math.random() * 4);

                  // Create Debris with tumbling physics
                  s.debris.push({
                    x: debrisX,
                    y: targetY,
                    vx,
                    vy: -90 - Math.random() * 50,
                    width: debrisW,
                    height: BLOCK_HEIGHT,
                    rotation: 0,
                    vRot,
                    type: s.falling.type,
                    colorSeed: s.falling.colorSeed,
                    isRightSide: !isLeftSlice,
                  });

                  // Enhanced cream splatters, cake crumbs, and fruit specks
                  spawnEnhancedSliceParticles(
                    isLeftSlice ? targetLeft : targetRight,
                    targetY,
                    isLeftSlice ? -1 : 1
                  );
                }

                // If an item was on the target block and it was sliced, item is missed
                if (targetItem) {
                  topBlock.item = null;
                  spawnItemMissParticles(finalX + finalWidth / 2, targetY);
                  addFloatingText(
                    finalX + finalWidth / 2,
                    targetY - 48,
                    'MISS! 需完美置中方可獲得',
                    '#9CA3AF'
                  );
                }
              }

              // Check if remaining width is too small to balance
              if (finalWidth < 12) {
                // Tower topples!
                s.gameOver = true;
                sound.playGameOver();
                s.screenShake = 14;

                // Push remaining sliver as falling debris
                s.debris.push({
                  x: finalX,
                  y: targetY,
                  vx: centerDiff > 0 ? 140 : -140,
                  vy: -100,
                  width: finalWidth,
                  height: BLOCK_HEIGHT,
                  rotation: 0,
                  vRot: centerDiff > 0 ? 6 : -6,
                  type: s.falling.type,
                  colorSeed: s.falling.colorSeed,
                  isRightSide: centerDiff > 0,
                });

                setTimeout(() => {
                  onGameOver(s.score, s.maxCombo);
                }, 800);
              } else {
                // Successfully placed!
                const isFever = s.combo >= 3;
                const pointsEarned = isFever ? 2 : 1;
                const oldScore = s.score;
                s.score += pointsEarned;
                s.squashTimer = 0.12;

                // Periodically spawn a new item sitting on top of the newly placed top block
                s.layersUntilNextItem -= 1;
                let newItemOnTop: DessertItem | null = null;
                let showItemIntro = false;
                if (s.layersUntilNextItem <= 0) {
                  const itemKeys: ItemType[] = ['golden_cherry', 'slow_clock', 'sugar_shield'];
                  let pickedKey: ItemType;
                  if (s.currentWidth < 110 && Math.random() < 0.6) {
                    pickedKey = 'golden_cherry';
                  } else if (s.activeShield > 0) {
                    pickedKey = Math.random() < 0.5 ? 'golden_cherry' : 'slow_clock';
                  } else {
                    pickedKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];
                  }
                  newItemOnTop = DESSERT_ITEMS[pickedKey];
                  s.layersUntilNextItem = Math.floor(Math.random() * 3) + 3; // next item in 3-5 layers
                  sound.playItemAppear();

                  // Only show explanation if this specific item has NEVER appeared in this run yet
                  if (!s.seenInRun.has(newItemOnTop.type)) {
                    showItemIntro = true;
                    s.seenInRun.add(newItemOnTop.type); // MARK IMMEDIATELY ON SPAWN!
                  }
                }

                s.blocks.push({
                  id: s.score,
                  x: finalX,
                  y: targetY,
                  width: finalWidth,
                  height: BLOCK_HEIGHT,
                  type: s.falling.type,
                  colorSeed: s.falling.colorSeed,
                  isPerfect,
                  creamDripSide: sliceSide,
                  item: newItemOnTop,
                  itemSpawnTime: newItemOnTop ? performance.now() : undefined,
                  showItemIntro,
                });

                // Milestone check: every 10 tiers (10, 20, 30, 40...)
                const oldTier = Math.floor(oldScore / 10);
                const newTier = Math.floor(s.score / 10);
                let currentMilestoneTitle: string | null = null;
                if (newTier > oldTier && s.score >= 10) {
                  const tierLevel = newTier * 10;
                  currentMilestoneTitle = MILESTONE_TITLES[tierLevel] || '傳奇甜點之巔';
                  sound.playMilestone();
                  spawnMilestoneConfetti(cw, s.cameraY);
                  addFloatingText(cw / 2, s.cameraY + ch * 0.35, `🏆 解鎖稱號【${currentMilestoneTitle}】!`, '#F59E0B');
                  s.screenShake = 6;
                }

                // Target Camera Y shifts up to track tower height
                // Keep top block at ~60% of canvas height
                s.targetCameraY = Math.min(0, targetY - ch * 0.62);

                onScoreUpdate(
                  s.score,
                  s.combo,
                  s.slowMoCharges > 0 ? 0.65 : 1.0,
                  isFever,
                  currentMilestoneTitle,
                  {
                    shieldCount: s.activeShield,
                    slowMoCharges: s.slowMoCharges,
                    lastCollectedItem: targetItem && isPerfect ? targetItem : null,
                  },
                  newItemOnTop
                );
              }

              s.falling = null;
              s.fallingItem = null;
              s.isDropping = false;
            }
          }
        }

        // Camera Smooth Tracking (lerp)
        s.cameraY += (s.targetCameraY - s.cameraY) * 0.12;
      }

      // Update Debris (falling slices)
      for (let i = s.debris.length - 1; i >= 0; i--) {
        const d = s.debris[i];
        d.vy += GRAVITY * dt;
        d.y += d.vy * dt;
        d.x += d.vx * dt;
        d.rotation += d.vRot * dt;

        // Clean up out-of-screen debris
        if (d.y > s.cameraY + ch + 200) {
          s.debris.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 350 * dt;
        p.rotation += p.vRot * dt;
        p.alpha -= p.decay * dt;

        if (p.alpha <= 0) {
          s.particles.splice(i, 1);
        }
      }

      // Update Floating Texts
      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.alpha -= 1.1 * dt;
        ft.scale = Math.min(1.2, ft.scale + dt * 0.6);

        if (ft.alpha <= 0) {
          s.floatingTexts.splice(i, 1);
        }
      }

      // Update Timers & Shake
      if (s.squashTimer > 0) {
        s.squashTimer = Math.max(0, s.squashTimer - dt);
      }
      if (s.screenShake > 0) {
        s.screenShake = Math.max(0, s.screenShake - 25 * dt);
      }

      // 2. RENDER SCENE
      renderScene(ctx, s, cw, ch);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying, isPaused, onGameOver, onScoreUpdate]);

  // Helper: Particle Spawners
  const spawnPerfectParticles = (x: number, y: number) => {
    const s = stateRef.current;
    const colors = ['#F59E0B', '#FBBF24', '#FCD34D', '#FFFFFF', '#FF6B8B'];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.5;
      const speed = 120 + Math.random() * 220;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 1.2 + Math.random() * 0.8,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 8,
        shape: Math.random() > 0.5 ? 'star' : 'sparkle',
      });
    }
  };

  // Enhanced slice particles: Cream Splatters, Sponge Crumbs, and Fruit Specks
  const spawnEnhancedSliceParticles = (x: number, y: number, dir: number) => {
    const s = stateRef.current;
    // 1. Whipped cream droplets (12 particles)
    const creamColors = ['#FFFDF5', '#FFFBEB', '#FFF7ED', '#FDF2F8', '#FFFFFF'];
    for (let i = 0; i < 12; i++) {
      s.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: dir * (50 + Math.random() * 160) + (Math.random() - 0.5) * 40,
        vy: -50 - Math.random() * 150,
        size: 3.5 + Math.random() * 4,
        color: creamColors[i % creamColors.length],
        alpha: 1,
        decay: 1.2 + Math.random() * 0.7,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 8,
        shape: 'cream',
        isCream: true,
      });
    }

    // 2. Sponge cake crumbs (8 particles)
    const crumbColors = ['#D97706', '#F59E0B', '#B45309', '#059669', '#EF4444'];
    for (let i = 0; i < 8; i++) {
      s.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: dir * (30 + Math.random() * 120),
        vy: -30 - Math.random() * 110,
        size: 2 + Math.random() * 3,
        color: crumbColors[Math.floor(Math.random() * crumbColors.length)],
        alpha: 1,
        decay: 1.8 + Math.random() * 0.8,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 6,
        shape: 'circle',
      });
    }

    // 3. Berry red sprinkles (4 particles)
    for (let i = 0; i < 4; i++) {
      s.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: dir * (60 + Math.random() * 140),
        vy: -60 - Math.random() * 120,
        size: 2.5 + Math.random() * 2,
        color: '#DC2626',
        alpha: 1,
        decay: 1.5,
        rotation: 0,
        vRot: 0,
        shape: 'circle',
      });
    }
  };

  // Width Recovery Particles (when combo >= 2)
  const spawnRecoverParticles = (x: number, y: number) => {
    const s = stateRef.current;
    const colors = ['#10B981', '#34D399', '#6EE7B7', '#FBBF24', '#FFFFFF'];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 70 + Math.random() * 110;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: 3 + Math.random() * 4,
        color: colors[i % colors.length],
        alpha: 1,
        decay: 1.3,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 6,
        shape: 'sparkle',
      });
    }
  };

  // Milestone 10-Tier Confetti Ribbon Cannon
  const spawnMilestoneConfetti = (cw: number, cameraY: number) => {
    const s = stateRef.current;
    const confettiColors = ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#FCD34D'];
    for (let i = 0; i < 42; i++) {
      const rx = Math.random() * cw;
      const ry = cameraY + 40 + Math.random() * 140;
      s.particles.push({
        x: rx,
        y: ry,
        vx: (Math.random() - 0.5) * 160,
        vy: 30 + Math.random() * 110, // gently flutter downwards
        size: 5 + Math.random() * 4,
        color: confettiColors[i % confettiColors.length],
        alpha: 1,
        decay: 0.35 + Math.random() * 0.25, // lasts ~3 seconds
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 8,
        shape: 'confetti',
      });
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    const s = stateRef.current;
    s.floatingTexts.push({
      id: ++s.textIdCounter,
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 0.8,
      vy: -55,
    });
  };

  // Item Collection Particles (stars & sparkles bursting outward)
  const spawnItemCollectParticles = (x: number, y: number, color: string) => {
    const s = stateRef.current;
    const colors = [color, '#FFFFFF', '#FCD34D', '#F43F5E'];
    for (let i = 0; i < 22; i++) {
      const angle = (Math.PI * 2 * i) / 22;
      const speed = 75 + Math.random() * 125;
      s.particles.push({
        x,
        y: y - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        size: 3 + Math.random() * 4,
        color: colors[i % colors.length],
        alpha: 1,
        decay: 1.1,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 8,
        shape: i % 2 === 0 ? 'star' : 'sparkle',
      });
    }
  };

  // Shield Absorption Particles
  const spawnShieldAbsorbParticles = (x: number, y: number) => {
    const s = stateRef.current;
    const colors = ['#EA580C', '#F97316', '#FDBA74', '#FFFFFF'];
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18;
      const speed = 85 + Math.random() * 95;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.5 + Math.random() * 3,
        color: colors[i % colors.length],
        alpha: 1,
        decay: 1.3,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 6,
        shape: 'sparkle',
      });
    }
  };

  // Item Miss particles (subtle grey fade)
  const spawnItemMissParticles = (x: number, y: number) => {
    const s = stateRef.current;
    for (let i = 0; i < 8; i++) {
      s.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 40,
        vy: 20 + Math.random() * 40,
        size: 2.5 + Math.random() * 2,
        color: '#9CA3AF',
        alpha: 0.8,
        decay: 1.8,
        rotation: 0,
        vRot: 0,
        shape: 'circle',
      });
    }
  };

  // Render floating item badge above dessert block (higher altitude, solid opaque white icon badge, side explanation text)
  const drawItemBadge = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    item: DessertItem,
    timeSec: number,
    showFirstTimeBubble: boolean = false,
    bubbleAlpha: number = 1.0,
    cw: number = 400
  ) => {
    ctx.save();
    const floatY = Math.sin(timeSec * 4) * 3;
    // Elevated higher above the top dessert cake
    const py = cy + floatY - 44;
    const badgeR = 21;

    // 1. Soft glowing outer aura behind badge
    const aura = ctx.createRadialGradient(cx, py, 4, cx, py, 30);
    aura.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    aura.addColorStop(0.5, item.color + '44');
    aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, py, 30, 0, Math.PI * 2);
    ctx.fill();

    // 2. Solid Opaque White Pearl Disc (100% solid, NOT transparent!)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, py, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Crisp colorful border ring around badge
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = item.color;
    ctx.beginPath();
    ctx.arc(cx, py, badgeR, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Emoji Icon (100% opaque, vivid and non-transparent)
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.font = '24px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, cx, py + 1.5);
    ctx.restore();

    // 4. First-time Discovery Explanation Text (written to the right side of the icon, no background box)
    if (showFirstTimeBubble && bubbleAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = bubbleAlpha;

      ctx.font = '900 13px "M PLUS Rounded 1c", sans-serif';
      const nameMetrics = ctx.measureText(item.name);
      ctx.font = '700 11.5px "M PLUS Rounded 1c", sans-serif';
      const descMetrics = ctx.measureText(item.desc);
      const maxTextW = Math.max(nameMetrics.width, descMetrics.width);

      // Position text to the right of the icon; if too close to right edge, place on left
      const fitsOnRight = cx + badgeR + 10 + maxTextW < cw - 8;
      const textX = fitsOnRight ? cx + badgeR + 10 : cx - badgeR - 10;
      const align = fitsOnRight ? 'left' : 'right';

      ctx.textAlign = align;

      // Line 1: Item Name in bold item color with clean thick white outline
      ctx.font = '900 13px "M PLUS Rounded 1c", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeText(item.name, textX, py - 8);
      ctx.fillStyle = item.color;
      ctx.fillText(item.name, textX, py - 8);

      // Line 2: Item Description in dark roast coffee color with crisp white outline
      ctx.font = '700 11.5px "M PLUS Rounded 1c", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.5;
      ctx.lineJoin = 'round';
      ctx.strokeText(item.desc, textX, py + 8);
      ctx.fillStyle = '#1C1917';
      ctx.fillText(item.desc, textX, py + 8);

      ctx.restore();
    }

    ctx.restore();
  };

  // Helper: Canvas Render Function
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    s: typeof stateRef.current,
    cw: number,
    ch: number
  ) => {
    ctx.save();

    // Screen Shake Offset
    if (s.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * s.screenShake;
      const shakeY = (Math.random() - 0.5) * s.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Continuous Infinite Atmospheric Color Palettes (All high-luminance, soft pastel, Japanese dessert themes)
    const PALETTES = [
      // 0: Morning Vanilla Cream
      { top: [255, 253, 248], mid: [255, 244, 230], bot: [254, 215, 170] },
      // 1: Strawberry Sakura Blush
      { top: [255, 245, 247], mid: [255, 228, 230], bot: [254, 205, 211] },
      // 2: Peach Apricot Honey
      { top: [255, 247, 237], mid: [254, 237, 213], bot: [253, 186, 116] },
      // 3: Spring Matcha Breeze
      { top: [247, 254, 231], mid: [236, 252, 203], bot: [217, 249, 157] },
      // 4: Mint Soda Foam
      { top: [240, 253, 250], mid: [204, 251, 241], bot: [167, 243, 208] },
      // 5: Summer Azure & Peach
      { top: [224, 242, 254], mid: [186, 230, 253], bot: [254, 215, 170] },
      // 6: Dreamy Lilac Rose
      { top: [250, 245, 255], mid: [243, 232, 255], bot: [251, 207, 232] },
      // 7: Golden Sunlight Souffle
      { top: [255, 251, 235], mid: [254, 243, 199], bot: [253, 230, 138] },
    ];

    // Smooth continuous progress: shifts by layer stack + subtle live time drift
    const timeSec = (s.lastFrameTime || performance.now()) / 1000;
    const continuousT = (s.score * 0.25) + ((timeSec / 8) % PALETTES.length);
    const pLen = PALETTES.length;
    const idxA = Math.floor(continuousT) % pLen;
    const idxB = (idxA + 1) % pLen;
    const rawF = continuousT - Math.floor(continuousT);
    // Smoothstep interpolation
    const f = rawF * rawF * (3 - 2 * rawF);

    const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
    const colorToRgb = (c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

    const curTop = colorToRgb([
      lerp(PALETTES[idxA].top[0], PALETTES[idxB].top[0], f),
      lerp(PALETTES[idxA].top[1], PALETTES[idxB].top[1], f),
      lerp(PALETTES[idxA].top[2], PALETTES[idxB].top[2], f),
    ]);
    const curMid = colorToRgb([
      lerp(PALETTES[idxA].mid[0], PALETTES[idxB].mid[0], f),
      lerp(PALETTES[idxA].mid[1], PALETTES[idxB].mid[1], f),
      lerp(PALETTES[idxA].mid[2], PALETTES[idxB].mid[2], f),
    ]);
    const curBot = colorToRgb([
      lerp(PALETTES[idxA].bot[0], PALETTES[idxB].bot[0], f),
      lerp(PALETTES[idxA].bot[1], PALETTES[idxB].bot[1], f),
      lerp(PALETTES[idxA].bot[2], PALETTES[idxB].bot[2], f),
    ]);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, ch);
    bgGrad.addColorStop(0, curTop);
    bgGrad.addColorStop(0.5, curMid);
    bgGrad.addColorStop(1, curBot);

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    // Floating dynamic ambient sugar bubbles
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const bubbleX = (cw * ((i * 0.17 + timeSec * 0.02) % 1));
      const bubbleY = (ch * (1 - ((i * 0.19 + timeSec * 0.035) % 1)));
      const bubbleR = 14 + (i % 3) * 8;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleY, bubbleR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Cute subtle background polka dot pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const dotSpacing = 36;
    for (let px = 18; px < cw; px += dotSpacing) {
      for (let py = 18; py < ch; py += dotSpacing) {
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // World Coordinates Transformation (Camera Tracking)
    ctx.save();
    ctx.translate(0, -s.cameraY);

    // 1. Draw Base Plate Pedestal
    const baseBlock = s.blocks[0];
    if (baseBlock) {
      drawBasePlate(ctx, baseBlock.x - 12, baseBlock.y + 4, baseBlock.width + 24, 20);
    }

    // 2. Draw Stacked Blocks
    for (let i = 0; i < s.blocks.length; i++) {
      const b = s.blocks[i];
      // Only squish the very top placed block if timer is active
      const isTop = i === s.blocks.length - 1;
      const squashed = isTop && s.squashTimer > 0;
      drawDessertBlock(ctx, b.x, b.y, b.width, b.height, b.type, b.colorSeed, squashed, b.creamDripSide);
    }

    // 2.1 Draw Item Badge on top of the topmost stacked block
    const topPlacedBlock = s.blocks[s.blocks.length - 1];
    if (topPlacedBlock && topPlacedBlock.item && !s.gameOver) {
      const item = topPlacedBlock.item;
      const isFirstTime = !!topPlacedBlock.showItemIntro;
      const spawnTime = topPlacedBlock.itemSpawnTime || s.lastFrameTime;
      const ageSec = Math.max(0, (s.lastFrameTime - spawnTime) / 1000);

      let showBubble = false;
      let bubbleAlpha = 1.0;

      // Only show explanation on the very first appearance in this game, fading out after 4.0s
      if (isFirstTime && ageSec < 4.0) {
        showBubble = true;
        // Smooth fade out between 3.0s and 4.0s
        bubbleAlpha = ageSec > 3.0 ? Math.max(0, 1 - (ageSec - 3.0)) : 1.0;
      }

      drawItemBadge(
        ctx,
        topPlacedBlock.x + topPlacedBlock.width / 2,
        topPlacedBlock.y,
        item,
        timeSec,
        showBubble,
        bubbleAlpha,
        cw
      );
    }

    // Protective Caramel Shield glowing aura around top block
    if (s.activeShield > 0 && s.blocks.length > 0) {
      const top = s.blocks[s.blocks.length - 1];
      ctx.save();
      const pulse = Math.sin(timeSec * 5) * 0.15 + 0.85;
      ctx.strokeStyle = `rgba(234, 88, 12, ${pulse * 0.85})`;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      drawRoundRect(ctx, top.x - 3, top.y - 3, top.width + 6, top.height + 6, 6);
      ctx.stroke();
      ctx.fillStyle = `rgba(251, 146, 60, ${pulse * 0.16})`;
      ctx.fill();
      ctx.restore();
    }

    // 3. Draw Sliced Debris Pieces (Falling trimmed parts)
    for (const d of s.debris) {
      ctx.save();
      ctx.translate(d.x + d.width / 2, d.y + d.height / 2);
      ctx.rotate(d.rotation);
      drawDessertBlock(
        ctx,
        -d.width / 2,
        -d.height / 2,
        d.width,
        d.height,
        d.type,
        d.colorSeed,
        false
      );
      ctx.restore();
    }

    // 4. Draw Currently Falling Block (Clean dessert block, item is on stacked cake below)
    if (s.falling) {
      drawDessertBlock(
        ctx,
        s.falling.x,
        s.falling.y,
        s.falling.width,
        s.falling.height,
        s.falling.type,
        s.falling.colorSeed,
        false
      );
    }

    // 5. Draw Top Pendulum Mechanism (When not dropping)
    const pivotX = cw / 2;
    const pivotY = s.cameraY + 50;
    const armLen = BASE_ARM_LENGTH;

    const pendulumX = pivotX + armLen * Math.sin(s.swingAngle);
    const pendulumY = pivotY + armLen * Math.cos(s.swingAngle);

    // Clean Pendulum Ceiling Mount
    ctx.fillStyle = '#78350F';
    ctx.fillRect(pivotX - 22, s.cameraY + 2, 44, 12);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(pivotX - 22, s.cameraY + 2, 44, 12);

    // Golden pivot jewel
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pendulum Golden Chain Link Line
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pendulumX, pendulumY);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Golden Hook Clamp
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(pendulumX, pendulumY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Hook Arms gripping the dessert
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pendulumX - 10, pendulumY + 6);
    ctx.lineTo(pendulumX, pendulumY);
    ctx.lineTo(pendulumX + 10, pendulumY + 6);
    ctx.stroke();

    // Suspended Dessert (if not currently dropping)
    if (!s.falling && !s.gameOver && isPlaying) {
      const suspendedX = pendulumX - s.currentWidth / 2;
      const suspendedY = pendulumY - BLOCK_HEIGHT / 2 + 8;

      drawDessertBlock(
        ctx,
        suspendedX,
        suspendedY,
        s.currentWidth,
        BLOCK_HEIGHT,
        s.nextDessertType,
        s.nextColorSeed,
        false
      );

      // Clean vertical drop projection guide line pointing straight down
      ctx.save();
      const topBlock = s.blocks[s.blocks.length - 1];
      const targetGuideY = topBlock ? Math.max(suspendedY + BLOCK_HEIGHT + 40, topBlock.y) : suspendedY + BLOCK_HEIGHT + 120;
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(pendulumX, suspendedY + BLOCK_HEIGHT);
      ctx.lineTo(pendulumX, targetGuideY);
      ctx.stroke();

      // Left & Right edges soft vertical projection
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(suspendedX, suspendedY + BLOCK_HEIGHT);
      ctx.lineTo(suspendedX, targetGuideY);
      ctx.moveTo(suspendedX + s.currentWidth, suspendedY + BLOCK_HEIGHT);
      ctx.lineTo(suspendedX + s.currentWidth, targetGuideY);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Draw Particles
    for (const p of s.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'star') {
        drawStar(ctx, 0, 0, 5, p.size, p.size * 0.45);
      } else if (p.shape === 'sparkle') {
        drawSparkle(ctx, 0, 0, p.size);
      } else if (p.shape === 'cream') {
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.3, p.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'confetti') {
        ctx.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 7. Draw Floating Texts
    for (const ft of s.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = '900 20px "M PLUS Rounded 1c", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text stroke outline
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.strokeText(ft.text, ft.x, ft.y);

      // Text fill
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore(); // Restore camera translation

    ctx.restore(); // Restore shake
  };

  // Helper: Star shape
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerR: number,
    innerR: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerR;
      let y = cy + Math.sin(rot) * outerR;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
    ctx.fill();
  };

  const drawSparkle = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx, cy, cx + size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + size);
    ctx.quadraticCurveTo(cx, cy, cx - size, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - size);
    ctx.closePath();
    ctx.fill();
  };

  // Listen to keyboard space/enter/tap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleDrop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDrop]);

  return (
    <div
      className="relative w-full h-full select-none cursor-pointer overflow-hidden touch-none"
      onClick={handleDrop}
      onTouchStart={(e) => {
        // Prevent default touch scrolling and drop
        e.preventDefault();
        handleDrop();
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
