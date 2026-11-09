/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../game/audio';

interface PauseModalProps {
  score: number;
  combo: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  score,
  combo,
  isMuted,
  onToggleMute,
  onResume,
  onRestart,
  onHome,
}) => {
  const heightMeters = (score * 0.04).toFixed(1);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-amber-200/80 flex flex-col items-center text-center relative overflow-hidden">
        {/* Top Sound Toggle inside modal */}
        <div className="w-full flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
            <span>⏸️</span>
            <span>遊戲暫停</span>
          </div>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? '開啟音效' : '靜音'}
            className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 active:scale-95 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
          </button>
        </div>

        {/* Center Illustration */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-3xl shadow-inner mx-auto my-2">
          🥞
        </div>

        <h2 className="text-xl font-black text-stone-800 mb-1">
          休息一下！
        </h2>
        <p className="text-xs text-stone-500 mb-4">
          甜點師喘口氣，準備好再繼續挑戰更高塔頂！
        </p>

        {/* Current Run Progress Snapshot */}
        <div className="w-full bg-amber-50/70 rounded-2xl p-3 border border-amber-100 mb-4 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500 font-medium">當前堆疊層數</span>
            <span className="text-lg font-black text-amber-600 tabular-nums">
              {score} <span className="text-xs font-normal text-stone-500">層</span>
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500 font-medium">預估塔高</span>
            <span className="text-sm font-bold text-stone-700 tabular-nums">
              約 {heightMeters} m
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500 font-medium">當前連擊</span>
            <span className="text-sm font-bold text-rose-500 tabular-nums">
              {combo} COMBO
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          {/* Primary Resume Button */}
          <button
            onClick={() => {
              sound.playTap();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white font-bold text-sm shadow-md shadow-rose-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>繼續遊戲</span>
          </button>

          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => {
                sound.playTap();
                onRestart();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新開始</span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                onHome();
              }}
              className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>主選單</span>
            </button>
          </div>
        </div>

        {/* Keyboard shortcut tip */}
        <div className="mt-3 text-[10px] text-stone-400 font-medium">
          鍵盤亦可按「P」或「Escape」繼續
        </div>
      </div>
    </div>
  );
};
