"use client";
import React from 'react';

interface GroupHeaderProps {
  groupId: string;
  groupName: string;
  memberCount: number;
  onOpenExpense: () => void;
  onOpenSettle: () => void;
}

export default function GroupHeader({ groupId, groupName, memberCount, onOpenExpense, onOpenSettle }: GroupHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{groupName}</h1>
        <p className="text-slate-400 font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">group</span>
          {memberCount} Members
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Future AI Scanner Plugin */}
        <button 
          onClick={() => alert("AI Bill Scanner coming soon! This will open a file picker and send the image to the ML backend.")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-sm border border-amber-500/30 transition-all shadow-lg hover:shadow-amber-500/20"
        >
          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
          Upload Bill 🧾
        </button>

        <button 
          onClick={onOpenSettle}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-app-card hover:bg-slate-800 text-white font-bold text-sm border border-app-border transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">payments</span>
          Settle Up
        </button>

        <button 
          onClick={onOpenExpense}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-app-cyan to-[#00d2dd] hover:opacity-90 text-slate-900 font-bold text-sm shadow-glow-cyan transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Expense
        </button>
      </div>
    </div>
  );
}
