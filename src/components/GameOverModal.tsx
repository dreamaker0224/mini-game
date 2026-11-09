/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RotateCcw, Home, Share2, Award, Sparkles, Check } from 'lucide-react';
import { sound } from '../game/audio';

interface GameOverModalProps {
  score: number;
  maxCombo: number;
  bestScore: number;
  isNewRecord: boolean;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  maxCombo,
  bestScore,
  isNewRecord,
  onRestart,
  onHome,
}) => {
  const [copied, setCopied] = useState(false);

  // Derive chef title and height in meters
  const getChefTitle = (layers: number) => {
    if (layers < 10) return { title: '甜點見習生', desc: '初出茅廬的小甜點師，多掌握擺鐘節奏吧！', icon: '🧁' };
    if (layers < 20) return { title: '初級烘焙學徒', desc: '已經能穩定掌握舒芙蕾與蛋糕的落點節奏！', icon: '🥞' };
    if (layers < 30) return { title: '法式甜品心匠', desc: '裁切精準、重心平穩，深受顧客歡迎！', icon: '🍪' };
    if (layers < 40) return { title: '舒芙蕾名家', desc: '卓越的置中直覺，蛋糕塔直通天際！', icon: '🍰' };
    if (layers < 50) return { title: '特級甜點大師', desc: '神乎其技的擺鐘微操，大師級的指尖平衡！', icon: '👑' };
    if (layers < 60) return { title: '米其林三星甜點神', desc: '登峰造極！你的甜點塔突破大氣層！', icon: '🌟' };
    return { title: '傳奇甜點之巔', desc: '神乎其神！無可撼動的甜點界傳奇！', icon: '✨' };
  };

  const chef = getChefTitle(score);
  // Estimate height: each layer ~ 4cm
  const heightMeters = (score * 0.04).toFixed(2);

  const handleShare = () => {
    sound.playTap();
    const text = `我在《甜蜜擺鐘甜點塔》疊出了 ${score} 層高塔（約 ${heightMeters} 公尺）！榮獲【${chef.title}】稱號！最高連擊 ${maxCombo} Combo！快來挑戰吧！`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-amber-200/60 flex flex-col items-center text-center relative overflow-hidden">
        {/* Confetti or record banner */}
        {isNewRecord && (
          <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 py-1 text-white text-[11px] font-black tracking-wider flex items-center justify-center gap-1 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>破紀錄！NEW HIGH SCORE</span>
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
          </div>
        )}

        <div className={`mt-${isNewRecord ? '4' : '2'} mb-2`}>
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-3xl shadow-inner mx-auto mb-2">
            {chef.icon}
          </div>
          <h2 className="text-xl font-black text-stone-800">
            {isNewRecord ? '恭喜創下新紀錄！' : '遊戲結束！'}
          </h2>
          <div className="inline-block bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs px-2.5 py-0.5 rounded-full mt-1">
            {chef.title}
          </div>
        </div>

        <p className="text-xs text-stone-500 mb-4 px-2">{chef.desc}</p>

        {/* Score Breakdown Card */}
        <div className="w-full bg-amber-50/60 rounded-2xl p-3 border border-amber-100 mb-5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500 font-medium">本次堆疊層數</span>
            <span className="text-xl font-black text-amber-600 tabular-nums">
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
            <span className="text-stone-500 font-medium">最高連擊 (Max Combo)</span>
            <span className="text-sm font-bold text-rose-500 tabular-nums">
              {maxCombo} 次
            </span>
          </div>

          <div className="pt-1 border-t border-amber-200/50 flex justify-between items-center text-xs">
            <span className="text-stone-500 font-medium flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" /> 歷史最高紀錄
            </span>
            <span className="text-sm font-bold text-stone-800 tabular-nums">
              {bestScore} 層
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            onClick={() => {
              sound.playTap();
              onRestart();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-sm shadow-md shadow-rose-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再玩一次</span>
          </button>

          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製戰績！' : '分享戰績'}</span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                onHome();
              }}
              className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>回主選單</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
