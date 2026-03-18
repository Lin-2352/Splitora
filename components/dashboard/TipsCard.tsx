import React from 'react';

export default function TipsCard() {
  return (
    <div className="bg-[#1e1f2b] border border-app-border rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-app-purple/20 flex items-center justify-center mb-4 shadow-glow-purple border border-app-purple/30">
        <span className="material-symbols-outlined text-app-purple text-3xl">savings</span>
      </div>
      <p className="text-white font-medium mb-6">Save more money<br/>with our tips!</p>
      <button className="w-full py-3 bg-gradient-to-r from-app-purple to-[#c43add] hover:opacity-90 text-white font-bold rounded-xl transition-opacity shadow-glow-purple text-sm">
        VIEW TIPS
      </button>
    </div>
  );
}
