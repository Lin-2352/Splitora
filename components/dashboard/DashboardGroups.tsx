"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardGroups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<string, { credit: number; spending: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        
        // Fetch groups
        const res = await fetch('/api/getMyGroups', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) { setLoading(false); return; }
        
        const fetchedGroups = data.groups || [];
        setGroups(fetchedGroups);

        // Fetch treemap for per-group balance summary
        const treemapRes = await fetch('/api/user/dashboard/treemap', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const treemapData = await treemapRes.json();
        if (treemapRes.ok) {
          const map: Record<string, { credit: number; spending: number }> = {};
          for (const g of (treemapData.groups || [])) {
            const id = g.groupId?.toString();
            if (id) {
              map[id] = {
                credit: g.amount > 0 ? g.amount : 0,
                spending: g.amount < 0 ? Math.abs(g.amount) : 0
              };
            }
          }
          setBalances(map);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard groups:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-6">
        <div className="animate-pulse flex items-center gap-2 text-app-cyan font-semibold">
           <span className="material-symbols-outlined animate-spin text-lg">sync</span>
           Loading groups...
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="bg-app-card border border-app-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <span className="material-symbols-outlined text-3xl text-slate-500 mb-2">group_off</span>
        <p className="text-slate-400 font-medium">No groups yet.</p>
        <p className="text-slate-500 text-sm mt-1">Head to the Groups page to create or join one!</p>
      </div>
    );
  }

  // Neon colors for card accent
  const accents = [
    { border: 'border-[#00f2fe]/30', glow: 'hover:shadow-[0_0_20px_rgba(0,242,254,0.15)]' },
    { border: 'border-[#a82ee2]/30', glow: 'hover:shadow-[0_0_20px_rgba(168,46,226,0.15)]' },
    { border: 'border-[#ec5b13]/30', glow: 'hover:shadow-[0_0_20px_rgba(236,91,19,0.15)]' },
    { border: 'border-[#eab308]/30', glow: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group, index) => {
        const accent = accents[index % accents.length];
        const bal = balances[group._id?.toString()] || { credit: 0, spending: 0 };
        const net = bal.credit - bal.spending;

        return (
          <Link
            key={group._id}
            href={`/dashboard/groups/${group._id}`}
            className={`bg-app-card border ${accent.border} rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 hover:bg-slate-800/60 ${accent.glow} cursor-pointer group`}
          >
            {/* Group name */}
            <div className="flex items-center justify-between">
              <p className="text-white font-semibold text-sm truncate">{group.groupName}</p>
              <span className="material-symbols-outlined text-slate-600 text-[16px] group-hover:text-slate-400 transition-colors">arrow_forward</span>
            </div>

            {/* Balance summary */}
            <div className="flex items-center gap-4">
              {/* Credit */}
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#00f2fe]">arrow_upward</span>
                <span className="text-xs font-bold text-[#00f2fe]">₹{(bal.credit || 0).toFixed(0)}</span>
              </div>
              {/* Spending */}
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#a82ee2]">arrow_downward</span>
                <span className="text-xs font-bold text-[#a82ee2]">₹{(bal.spending || 0).toFixed(0)}</span>
              </div>
              {/* Net */}
              <div className="ml-auto">
                <span className={`text-xs font-bold ${net >= 0 ? 'text-[#00f2fe]' : 'text-[#a82ee2]'}`}>
                  {net >= 0 ? '+' : ''}₹{(net || 0).toFixed(0)}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
