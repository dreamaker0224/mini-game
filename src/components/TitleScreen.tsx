/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Sparkles, Award } from 'lucide-react';
import { sound } from '../game/audio';

interface TitleScreenProps {
  bestScore: number;
  bestCombo: number;
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  bestScore,
  bestCombo,
  onStart,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between items-center p-6 bg-gradient-to-b from-[#FFFDF9]/95 via-[#FFF4E6]/95 to-[#FED7AA]/95 backdrop-blur-sm text-stone-800">
      {/* Top Bar with sound toggle */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100/80 px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>日系療癒單機手遊</span>
        </div>

        <button
          onClick={onToggleMute}
          aria-label={isMuted ? '開啟音效' : '靜音'}
          className="p-2.5 rounded-full bg-white/80 shadow-sm border border-amber-200/60 text-stone-700 hover:bg-white active:scale-95 transition-all"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-stone-400" /> : <Volume2 className="w-5 h-5 text-amber-600" />}
        </button>
      </div>

      {/* Main Center Content */}
      <div className="flex flex-col items-center text-center my-auto max-w-xs">
        {/* Animated Dessert Icon Lockup */}
        <div className="relative mb-5">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-200 via-rose-200 to-amber-100 flex items-center justify-center shadow-lg shadow-rose-200/50 border-2 border-white animate-soft-pulse">
            <span className="text-5xl select-none">🥞</span>
          </div>
          <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            新上市
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-800 mb-1">
          甜蜜擺鐘甜點塔
        </h1>
        <p className="text-xs font-medium text-amber-800/80 mb-6 tracking-wide">
          Sweet Swing Stacker · 舒芙蕾與蛋糕塔
        </p>

        {/* Best Stats Card */}
        <div className="w-full bg-white/90 rounded-2xl p-4 shadow-sm border border-amber-200/50 mb-6">
          <div className="flex items-center justify-around divide-x divide-amber-100">
            <div className="flex flex-col items-center px-3">
              <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" /> 歷史最高
              </span>
              <span className="text-2xl font-black text-amber-600 tabular-nums">
                {bestScore} <span className="text-xs font-normal text-stone-600">層</span>
              </span>
            </div>
            <div className="flex flex-col items-center px-3">
              <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" /> 最高連擊
              </span>
              <span className="text-2xl font-black text-rose-500 tabular-nums">
                {bestCombo} <span className="text-xs font-normal text-stone-600">COMBO</span>
              </span>
            </div>
          </div>
        </div>

        {/* How to Play Rules */}
        <div className="text-left w-full bg-amber-50/70 rounded-xl p-3 border border-amber-100 text-xs text-stone-600 space-y-1.5 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
            <span>頂部擺鐘載著甜點<b>平穩擺盪</b>，均勻節奏好上手</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
            <span><b>輕觸螢幕任意處</b>掉落，落點未對齊會被削切</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
            <span>完美置中觸發<b>音階連擊加分</b>，掉出或倒塌則結束</span>
          </div>
        </div>

        {/* Start Game CTA */}
        <button
          onClick={() => {
            sound.playTap();
            onStart();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white font-bold text-base shadow-lg shadow-rose-500/25 active:scale-98 transition-all hover:brightness-105 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>開始製作甜點塔</span>
        </button>
      </div>

      {/* Footer hint */}
      <div className="text-[11px] text-stone-600 font-medium tracking-wide">
        電腦鍵盤亦可按「空白鍵」或「Enter」掉落
      </div>
    </div>
  );
};
