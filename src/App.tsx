/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { GameState } from './game/types';
import { sound } from './game/audio';
import { Smartphone } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [bestCombo, setBestCombo] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [newGameSignal, setNewGameSignal] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Load saved high scores & sound preference
  useEffect(() => {
    const savedBest = localStorage.getItem('sweet_stacker_best_score');
    if (savedBest) setBestScore(parseInt(savedBest, 10) || 0);

    const savedCombo = localStorage.getItem('sweet_stacker_best_combo');
    if (savedCombo) setBestCombo(parseInt(savedCombo, 10) || 0);

    setIsMuted(sound.getMuted());
  }, []);

  const handleToggleMute = useCallback(() => {
    const updated = sound.toggleMute();
    setIsMuted(updated);
  }, []);

  const handleStartGame = useCallback(() => {
    setGameState('PLAYING');
    setIsNewRecord(false);
    setNewGameSignal((prev) => prev + 1);
  }, []);

  const handleScoreUpdate = useCallback(
    (curScore: number, curCombo: number, curSpeed: number) => {
      setScore(curScore);
      setCombo(curCombo);
      setSpeedMultiplier(curSpeed);
    },
    []
  );

  const handleGameOver = useCallback(
    (finalScore: number, maxCombo: number) => {
      let isRecord = false;
      if (finalScore > bestScore) {
        setBestScore(finalScore);
        localStorage.setItem('sweet_stacker_best_score', String(finalScore));
        isRecord = true;
      }
      if (maxCombo > bestCombo) {
        setBestCombo(maxCombo);
        localStorage.setItem('sweet_stacker_best_combo', String(maxCombo));
      }
      setIsNewRecord(isRecord);
      setGameState('GAMEOVER');
    },
    [bestScore, bestCombo]
  );

  const handleRestart = useCallback(() => {
    handleStartGame();
  }, [handleStartGame]);

  const handleHome = useCallback(() => {
    setGameState('MENU');
  }, []);

  return (
    <div className="w-full h-screen h-[100dvh] flex items-center justify-center bg-[#1c1824] overflow-hidden select-none relative font-sans">
      {/* Subtle ambient pastry shop wallpaper decor on large desktop viewports */}
      <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col gap-4 text-stone-400/80 max-w-xs">
        <div className="flex items-center gap-2 text-amber-300 font-extrabold text-lg">
          <span>🥞</span>
          <span>甜蜜擺鐘甜點塔</span>
        </div>
        <p className="text-xs leading-relaxed text-stone-300">
          結合日系舒芙蕾甜點與物理擺鐘裁切的休閒益智小遊戲。點擊螢幕讓甜點精準下墜疊加，考驗玩家的節奏感與微操直覺！
        </p>
        <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-800 text-xs space-y-1">
          <div className="text-amber-400 font-bold">遊戲操作：</div>
          <div>• 點擊螢幕任意處掉落甜點</div>
          <div>• 電腦亦可按空白鍵 / Enter 鍵</div>
          <div>• 連續精準置中獲得連擊加分</div>
        </div>
      </div>

      <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-2 text-stone-400 text-xs">
        <Smartphone className="w-6 h-6 text-amber-400 animate-bounce" />
        <span className="font-medium text-stone-300">手機直式最佳化體驗</span>
      </div>

      {/* Mobile Phone Mockup Container (Responsive for both desktop simulation & native phones) */}
      <main 
        id="game-viewport" 
        tabIndex={0}
        aria-label="遊戲視窗"
        className="relative w-full h-full max-w-[440px] max-h-[880px] sm:h-[94vh] sm:rounded-[38px] sm:shadow-[0_0_50px_rgba(0,0,0,0.6)] sm:border-[6px] sm:border-stone-800 bg-[#FFFDF8] overflow-hidden flex flex-col focus:outline-none"
      >
        {/* Dynamic Game Canvas Viewport */}
        <GameCanvas
          isPlaying={gameState === 'PLAYING'}
          onGameOver={handleGameOver}
          onScoreUpdate={handleScoreUpdate}
          onNewGameSignal={newGameSignal}
        />

        {/* HUD Overlay during active play */}
        {gameState === 'PLAYING' && (
          <GameHUD
            score={score}
            combo={combo}
            speedMultiplier={speedMultiplier}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onRestart={handleRestart}
          />
        )}

        {/* Title Screen Overlay */}
        {gameState === 'MENU' && (
          <TitleScreen
            bestScore={bestScore}
            bestCombo={bestCombo}
            onStart={handleStartGame}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* Game Over Modal */}
        {gameState === 'GAMEOVER' && (
          <GameOverModal
            score={score}
            maxCombo={combo}
            bestScore={bestScore}
            isNewRecord={isNewRecord}
            onRestart={handleRestart}
            onHome={handleHome}
          />
        )}
      </main>
    </div>
  );
}
