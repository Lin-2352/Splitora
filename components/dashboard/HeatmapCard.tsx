import React from 'react';

export default function HeatmapCard() {
  const colors = ['bg-slate-800', 'bg-blue-500/40', 'bg-app-cyan/70', 'bg-app-purple'];
  const columns = Array.from({ length: 24 });
  const rows = Array.from({ length: 6 });

  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Expense Activity Heatmap</h2>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-slate-800"></div>
            <div className="w-3 h-3 rounded-sm bg-blue-500/40"></div>
            <div className="w-3 h-3 rounded-sm bg-app-cyan/70"></div>
            <div className="w-3 h-3 rounded-sm bg-app-purple"></div>
          </div>
          <span>More</span>
        </div>
      </div>
      
      {/* Heatmap Grid Mockup */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {/* Y-Axis (Days) */}
        <div className="flex flex-col gap-1.5 justify-between py-1 text-[10px] text-slate-500 font-medium pr-2">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        
        {/* Grid Area */}
        <div className="flex flex-1 gap-1.5 min-w-[600px]">
          {columns.map((_, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1.5">
              {rows.map((_, rowIdx) => {
                // Determine a pseudo-random color class based on indices to avoid hydration mismatches
                const colorClass = colors[(colIdx * rowIdx + colIdx + rowIdx) % colors.length];
                return (
                  <div 
                    key={rowIdx} 
                    className={`w-4 h-4 rounded-sm ${colorClass} border border-slate-700/50 hover:border-white transition-colors cursor-pointer`}
                    title="Activity details"
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
