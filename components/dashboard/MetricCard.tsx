import React from 'react';

interface MetricCardProps {
  title: string;
  amount: string;
  amountColor?: string;
  strokeColor: string;
  shadowColor?: string;
  svgPath: string;
}

export default function MetricCard({ 
  title, 
  amount, 
  amountColor = "text-white", 
  strokeColor, 
  shadowColor, 
  svgPath 
}: MetricCardProps) {
  return (
    <div className="bg-app-card border border-app-border rounded-xl p-4 flex items-center justify-between shadow-sm">
      <div>
        <p className="text-slate-400 text-xs font-medium mb-1">{title}</p>
        <p className={`${amountColor} font-bold`}>{amount}</p>
      </div>
      <div className="w-16 h-8">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 50 20">
          <path 
            d={svgPath} 
            fill="none" 
            stroke={strokeColor} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            style={shadowColor ? { filter: `drop-shadow(0 2px 3px ${shadowColor})` } : undefined}
          ></path>
        </svg>
      </div>
    </div>
  );
}
