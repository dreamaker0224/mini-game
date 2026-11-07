/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, RotateCcw, Flame } from 'lucide-react';
import { sound } from '../game/audio';

interface GameHUDProps {
  score: number;
  combo: number;
  speedMultiplier: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  combo,
  speedMultiplier,
  isMuted,
  onToggleMute,
  onRestart,
}) => {
  return (
    <div className="absolute top-0 inset-x-0 z-20 pointer-events-none p-4 flex flex-col items-center">
      {/* Top Header Controls & Score Bar */}
      <div className="w-full flex items-center justify-between pointer-events-auto">
        {/* Tower Height Badge */}
        <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold shadow-sm border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="tabular-nums">約 {(score * 0.04).toFixed(1)} m 高</span>
        </div>

        {/* Score Cluster in Center */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-1 drop-shadow-md">
            <span className="text-3xl font-black text-amber-500 tabular-nums">
              {score}
            </span>
            <span className="text-xs font-bold text-amber-600">層</span>
          </div>
        </div>

        {/* Top Right Control Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sound.playTap();
              onRestart();
            }}
            aria-label="重開一局"
            className="p-2 rounded-full bg-black/30 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/40 active:scale-95 transition-all border border-white/20 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? '開啟音效' : '靜音'}
            className="p-2 rounded-full bg-black/30 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/40 active:scale-95 transition-all border border-white/20 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>
        </div>
      </div>

      {/* Combo Floating Badge */}
      {combo > 1 && (
        <div className="mt-2 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg border border-white/40 animate-bounce">
          <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
          <span>{combo} 連續完美置中！</span>
        </div>
      )}

      {/* Quick Tap Hint at bottom or beneath top bar */}
      <div className="mt-2 text-[11px] font-medium text-stone-600 bg-white/70 backdrop-blur-sm px-3 py-0.5 rounded-full border border-stone-200/50 shadow-sm">
        輕觸螢幕讓甜點掉落
      </div>
    </div>
  );
};
