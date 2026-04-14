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
        <h1 className="text-3xl md:text-4xl font-black text-white light:text-slate-900 tracking-tight mb-2">{groupName}</h1>
        <p className="text-slate-400 font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">group</span>
          {memberCount} Members
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">

        <button 
          onClick={onOpenSettle}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-b from-[#b224ef] to-[#7579ff] text-white font-bold text-sm shadow-[0_0_15px_rgba(178,36,239,0.4)] hover:shadow-[0_0_25px_rgba(178,36,239,0.6)] transition-all hover:-translate-y-0.5 border-none"
        >
          <span className="material-symbols-outlined text-[20px]">payments</span>
          Settle Up
        </button>

        <button 
          onClick={onOpenExpense}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-b from-[#00f2fe] to-[#4facfe] text-slate-900 font-bold text-sm shadow-[0_0_15px_rgba(0,242,254,0.4)] hover:shadow-[0_0_25px_rgba(0,242,254,0.6)] transition-all hover:-translate-y-0.5 border-none"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Expense
        </button>
      </div>
    </div>
  );
}
