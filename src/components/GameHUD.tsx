/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, RotateCcw, Flame, Pause, Play } from 'lucide-react';
import { sound } from '../game/audio';
import { ActiveBuffs, DessertItem } from '../game/types';

interface GameHUDProps {
  score: number;
  combo: number;
  speedMultiplier: number;
  isMuted: boolean;
  isFever?: boolean;
  isPaused?: boolean;
  milestoneTitle?: string | null;
  activeBuffs?: ActiveBuffs;
  incomingItem?: DessertItem | null;
  onToggleMute: () => void;
  onTogglePause?: () => void;
  onRestart: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  combo,
  speedMultiplier,
  isMuted,
  isFever = false,
  isPaused = false,
  milestoneTitle = null,
  activeBuffs = { shieldCount: 0, slowMoCharges: 0, lastCollectedItem: null },
  incomingItem = null,
  onToggleMute,
  onTogglePause,
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
            <span className={`text-3xl font-black tabular-nums transition-colors ${
              isFever ? 'text-rose-500 drop-shadow-[0_2px_10px_rgba(244,63,94,0.4)]' : 'text-amber-500'
            }`}>
              {score}
            </span>
            <span className="text-xs font-bold text-amber-600">層</span>
          </div>
          {isFever && (
            <span className="text-[10px] font-black tracking-wide text-rose-500 uppercase animate-pulse">
              ⚡ FEVER x2
            </span>
          )}
        </div>

        {/* Top Right Control Buttons */}
        <div className="flex items-center gap-1.5">
          {onTogglePause && (
            <button
              onClick={() => {
                sound.playTap();
                onTogglePause();
              }}
              aria-label={isPaused ? '繼續遊戲' : '暫停遊戲'}
              className="p-2 rounded-full bg-black/30 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/40 active:scale-95 transition-all border border-white/20 cursor-pointer"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" /> : <Pause className="w-4 h-4 text-amber-300" />}
            </button>
          )}

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

      {/* Unlocked Milestone Title Celebratory Banner */}
      {milestoneTitle && (
        <div className="mt-2.5 flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-amber-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-xl border-2 border-white animate-bounce drop-shadow">
          <span className="text-sm">🏆</span>
          <span>解鎖稱號：【{milestoneTitle}】</span>
          <span className="text-sm">✨</span>
        </div>
      )}

      {/* Combo & Sweet Fever Floating Badge */}
      {combo > 1 && (
        <div className={`mt-2 flex items-center gap-1.5 font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-white/40 transition-all ${
          isFever
            ? 'bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 text-white animate-pulse shadow-rose-400/50 scale-105'
            : 'bg-gradient-to-r from-amber-500 to-rose-500 text-white animate-bounce'
        }`}>
          <Flame className={`w-3.5 h-3.5 ${isFever ? 'fill-yellow-200 text-yellow-200' : 'fill-amber-300 text-amber-300'}`} />
          <span>
            {combo} 連續完美！
            {isFever ? ' ⚡ 狂熱雙倍得分！' : ' 🍰 寬度回補+8px'}
          </span>
        </div>
      )}

      {/* Active Buffs Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
        {activeBuffs.shieldCount > 0 && (
          <div className="flex items-center gap-1 bg-amber-600/90 text-white font-black text-[11px] px-2.5 py-1 rounded-full shadow-md border border-amber-300/60 backdrop-blur-sm animate-pulse">
            <span>🛡️</span>
            <span>保命護盾已裝備</span>
          </div>
        )}
        {activeBuffs.slowMoCharges > 0 && (
          <div className="flex items-center gap-1 bg-cyan-600/90 text-white font-black text-[11px] px-2.5 py-1 rounded-full shadow-md border border-cyan-300/60 backdrop-blur-sm">
            <span>⏰</span>
            <span>慢速時鐘中（剩餘 {activeBuffs.slowMoCharges} 次）</span>
          </div>
        )}
      </div>

      {/* Target Item Notice on the stacked cake below */}
      {incomingItem && (
        <div className="mt-1.5 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-stone-800 text-[11px] font-black shadow-md border border-amber-300/80 animate-bounce">
          <span className="text-sm">{incomingItem.icon}</span>
          <span className="text-amber-700">下方有【{incomingItem.name}】！</span>
          <span className="text-stone-500 font-medium">完美疊中即可捕獲</span>
        </div>
      )}

      {/* Quick Tap Hint at bottom or beneath top bar */}
      <div className="mt-2 text-[11px] font-medium text-stone-600 bg-white/70 backdrop-blur-sm px-3 py-0.5 rounded-full border border-stone-200/50 shadow-sm">
        輕觸螢幕讓甜點掉落
      </div>
    </div>
  );
};
