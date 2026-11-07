/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Block, Debris, DessertType, FallingBlock, FloatingText, Particle } from '../game/types';
import { DESSERT_LIST, drawBasePlate, drawDessertBlock } from '../game/desserts';
import { sound } from '../game/audio';

interface GameCanvasProps {
  isPlaying: boolean;
  onGameOver: (finalScore: number, maxCombo: number) => void;
  onScoreUpdate: (score: number, combo: number, speedMultiplier: number) => void;
  onNewGameSignal: number; // Increment to reset
}

const INITIAL_WIDTH = 180;
const BLOCK_HEIGHT = 28;
const BASE_ARM_LENGTH = 160;
const GRAVITY = 1600;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  isPlaying,
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
    isDropping: boolean;
    gameOver: boolean;
    squashTimer: number;
    screenShake: number;
    lastFrameTime: number;
    textIdCounter: number;
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
    isDropping: false,
    gameOver: false,
    squashTimer: 0,
    screenShake: 0,
    lastFrameTime: 0,
    textIdCounter: 0,
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

    s.score = 0;
    s.combo = 0;
    s.maxCombo = 0;
    s.currentWidth = baseWidth;
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
    s.isDropping = false;
    s.gameOver = false;
    s.squashTimer = 0;
    s.screenShake = 0;
    s.lastFrameTime = performance.now();

    onScoreUpdate(0, 0, 1.0);
  }, [onScoreUpdate]);

  // Handle Drop Action (tap/click/space)
  const handleDrop = useCallback(() => {
    const s = stateRef.current;
    if (!isPlaying || s.gameOver || s.isDropping || s.falling) return;

    const cw = s.width;
    const pivotX = cw / 2;
    const pivotY = s.cameraY + 50;

    // Current suspended dessert coordinates
    const curTheta = s.swingAngle;
    const armLen = BASE_ARM_LENGTH;
    const dessertX = pivotX + armLen * Math.sin(curTheta) - s.currentWidth / 2;
    const dessertY = pivotY + armLen * Math.cos(curTheta) - BLOCK_HEIGHT / 2;

    // Straight vertical drop with zero horizontal inertia
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
  }, [isPlaying]);

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

      // 1. UPDATE LOGIC
      if (isPlaying && !s.gameOver) {
        // Constant, comfortable swing speed
        const swingSpeed = 2.5;
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
              // Missed completely! Falls to doom
              s.gameOver = true;
              sound.playGameOver();
              s.screenShake = 12;

              // Camera follows the falling block slightly
              setTimeout(() => {
                onGameOver(s.score, s.maxCombo);
              }, 700);
            } else {
              // Hit the tower!
              const centerDiff = (dropLeft + dropRight) / 2 - (targetLeft + targetRight) / 2;
              const isPerfect = Math.abs(centerDiff) <= 4.5;

              let finalX: number;
              let finalWidth: number;

              if (isPerfect) {
                // Perfect Snap!
                finalX = targetLeft;
                finalWidth = topBlock.width;
                s.combo += 1;
                s.maxCombo = Math.max(s.maxCombo, s.combo);

                // Width bonus if combo is high
                if (s.combo >= 4 && s.currentWidth < INITIAL_WIDTH) {
                  s.currentWidth = Math.min(INITIAL_WIDTH, s.currentWidth + 6);
                  finalWidth = s.currentWidth;
                }

                sound.playLand(s.combo, true);

                // Add Sparkles and Perfect Text
                spawnPerfectParticles(finalX + finalWidth / 2, targetY);
                addFloatingText(
                  finalX + finalWidth / 2,
                  targetY - 10,
                  s.combo > 1 ? `PERFECT x${s.combo}!` : 'PERFECT!',
                  '#F59E0B'
                );

                s.screenShake = 4;
              } else {
                // Slice Mechanic: excess is trimmed
                s.combo = 0;
                finalX = overlapLeft;
                finalWidth = overlapWidth;
                s.currentWidth = finalWidth;

                sound.playSlice();
                sound.playLand(0, false);
                s.screenShake = 3;

                // Create Debris for the sliced off part
                if (dropLeft < targetLeft) {
                  // Left side sliced off
                  const debrisW = targetLeft - dropLeft;
                  s.debris.push({
                    x: dropLeft,
                    y: targetY,
                    vx: -110,
                    vy: -80,
                    width: debrisW,
                    height: BLOCK_HEIGHT,
                    rotation: 0,
                    vRot: -5,
                    type: s.falling.type,
                    colorSeed: s.falling.colorSeed,
                    isRightSide: false,
                  });
                } else if (dropRight > targetRight) {
                  // Right side sliced off
                  const debrisW = dropRight - targetRight;
                  s.debris.push({
                    x: targetRight,
                    y: targetY,
                    vx: 110,
                    vy: -80,
                    width: debrisW,
                    height: BLOCK_HEIGHT,
                    rotation: 0,
                    vRot: 5,
                    type: s.falling.type,
                    colorSeed: s.falling.colorSeed,
                    isRightSide: true,
                  });
                }

                // Minor crumb particles
                spawnSliceCrumbParticles(
                  dropLeft < targetLeft ? targetLeft : targetRight,
                  targetY
                );
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
                s.score += 1;
                s.squashTimer = 0.12;

                s.blocks.push({
                  id: s.score,
                  x: finalX,
                  y: targetY,
                  width: finalWidth,
                  height: BLOCK_HEIGHT,
                  type: s.falling.type,
                  colorSeed: s.falling.colorSeed,
                  isPerfect,
                });

                // Target Camera Y shifts up to track tower height
                // Keep top block at ~60% of canvas height
                s.targetCameraY = Math.min(0, targetY - ch * 0.62);

                onScoreUpdate(s.score, s.combo, 1.0);
              }

              s.falling = null;
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
  }, [isPlaying, onGameOver, onScoreUpdate]);

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

  const spawnSliceCrumbParticles = (x: number, y: number) => {
    const s = stateRef.current;
    const colors = ['#FFE8A3', '#D9822B', '#FF2E55', '#FFFFFF'];
    for (let i = 0; i < 10; i++) {
      s.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 160,
        vy: -40 - Math.random() * 120,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 1.8 + Math.random() * 0.8,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 6,
        shape: 'circle',
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

    // Dynamic Atmosphere Sky based on height
    const heightProgress = Math.min(1, s.score / 35);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, ch);

    if (heightProgress < 0.3) {
      // Morning Cream Patisserie
      bgGrad.addColorStop(0, '#FFF7ED');
      bgGrad.addColorStop(0.5, '#FFEDD5');
      bgGrad.addColorStop(1, '#FED7AA');
    } else if (heightProgress < 0.6) {
      // Afternoon Strawberry Tea
      bgGrad.addColorStop(0, '#FFF1F2');
      bgGrad.addColorStop(0.5, '#FFE4E6');
      bgGrad.addColorStop(1, '#FECDD3');
    } else if (heightProgress < 0.85) {
      // Golden Hour Sunset
      bgGrad.addColorStop(0, '#FDF2F8');
      bgGrad.addColorStop(0.5, '#FCE7F3');
      bgGrad.addColorStop(1, '#F472B6');
    } else {
      // Twilight Starry Dessert Sky
      bgGrad.addColorStop(0, '#312E81');
      bgGrad.addColorStop(0.5, '#4C1D95');
      bgGrad.addColorStop(1, '#701A75');
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    // Cute subtle background pattern (polka dots or stars)
    ctx.fillStyle = heightProgress > 0.85 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.35)';
    const dotSpacing = 36;
    for (let px = 18; px < cw; px += dotSpacing) {
      for (let py = 18; py < ch; py += dotSpacing) {
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
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
      drawDessertBlock(ctx, b.x, b.y, b.width, b.height, b.type, b.colorSeed, squashed);
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

    // 4. Draw Currently Falling Block
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

    // Pendulum ceiling mount
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

      // Clear vertical drop projection guide line pointing straight down
      ctx.save();
      const topBlock = s.blocks[s.blocks.length - 1];
      const targetGuideY = topBlock ? Math.max(suspendedY + BLOCK_HEIGHT + 40, topBlock.y) : suspendedY + BLOCK_HEIGHT + 120;
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(pendulumX, suspendedY + BLOCK_HEIGHT);
      ctx.lineTo(pendulumX, targetGuideY);
      ctx.stroke();

      // Left & Right edges soft vertical projection
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.15)';
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
