"use client";
import React, { useState, useEffect } from 'react';

interface BalancesCardProps {
  groupId: string;
  refreshTrigger?: number;
  onRefresh?: () => void;
  members?: any[];
  currentUserIsLeader?: boolean;
  currentUserId?: string;
  onOpenSettle?: (recipientId: string, amount: string) => void;
}

export default function BalancesCard({ groupId, refreshTrigger = 0, onRefresh, members = [], currentUserIsLeader = false, currentUserId = '', onOpenSettle }: BalancesCardProps) {
  const [balances, setBalances] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulkSettling, setBulkSettling] = useState(false);
  const [settlingIdx, setSettlingIdx] = useState<number | null>(null);
  const [isSimplified, setIsSimplified] = useState(false);

  const getUserName = (userId: string) => {
    const member = members.find((m: any) => {
      const id = m.user?._id || m.user;
      return id?.toString() === userId?.toString();
    });
    return member?.user?.userName || member?.user?.name || member?.user?.email || 'Unknown';
  };

  const fetchBalances = async (simplified: boolean = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const endpoint = simplified ? `/api/${groupId}/simplify-debt` : `/api/${groupId}/balance`;
      const method = simplified ? 'POST' : 'GET';
      
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch balances');
      
      // The API formats might differ slightly depending on the route (simplify-debt uses simplifiedDebts, balance uses balances)
      const rawDebts = data.simplifiedDebts || data.balances || [];
      
      // Filter out zero-amount debts (floating point rounding artifacts)
      const debts = rawDebts.filter((d: any) => Math.abs(d.amount) >= 0.01);
      setBalances(debts);
      setIsSimplified(simplified);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchBalances();
  }, [groupId, refreshTrigger]);

  const handleBulkSettle = async () => {
    if (!balances || balances.length === 0) return;
    
    const confirmMsg = `This will record ${balances.length} settlement(s) to resolve ALL outstanding debts. Continue?`;
    if (!confirm(confirmMsg)) return;

    try {
      setBulkSettling(true);
      const token = localStorage.getItem('token');

      const res = await fetch(`/api/${groupId}/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settlements: balances })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk settle failed');

      setBalances([]);
      onRefresh?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setBulkSettling(false);
    }
  };

  const handleIndividualSettle = async (debt: any, idx: number) => {
    const fromName = debt.fromUser?.userName || getUserName(debt.from);
    const toName = debt.toUser?.userName || getUserName(debt.to);
    const confirmMsg = `Record settlement: ${fromName} pays ${toName} ₹${Number(debt.amount).toFixed(2)}?`;
    if (!confirm(confirmMsg)) return;

    try {
      setSettlingIdx(idx);
      const token = localStorage.getItem('token');

      const res = await fetch(`/api/${groupId}/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settlements: [debt] })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Settlement failed');

      // Remove this one from local state
      setBalances((prev: any[]) => prev.filter((_: any, i: number) => i !== idx));
      onRefresh?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSettlingIdx(null);
    }
  };

  // Check if current user is the debtor (the person who owes money)
  const isUserDebtor = (debt: any) => {
    const fromId = (debt.fromUser?._id || debt.from)?.toString();
    return fromId === currentUserId;
  };

  return (
    <div className="relative bg-slate-900/60 light:bg-white/80 backdrop-blur-2xl border border-slate-800/60 light:border-slate-200 shadow-2xl light:shadow-lg rounded-3xl flex flex-col h-[400px] overflow-hidden group hover:border-slate-700/80 transition-all duration-500">
      {/* Top Edge Neon String */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-app-red to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="p-5 border-b border-slate-800/50 light:border-slate-200 bg-slate-800/20 light:bg-slate-50/50 flex justify-between items-center relative z-10">
        <h3 className="font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-app-red">account_balance_wallet</span>
          Group Balances
        </h3>
        <div className="flex items-center gap-2">
          {/* Simplify Debts Toggle */}
          {!loading && balances && balances.length > 0 && (
            <button
              onClick={() => fetchBalances(!isSimplified)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all shadow-lg hover:-translate-y-0.5 border-none ${isSimplified ? 'bg-gradient-to-r from-[#a82ee2] to-[#7e22ce] text-white shadow-[0_0_15px_rgba(168,46,226,0.4)]' : 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-slate-900 shadow-[0_0_15px_rgba(0,242,254,0.4)]'}`}
              title={isSimplified ? "View Raw Debts" : "Run simplify algorithm"}
            >
              <span className={`material-symbols-outlined text-[14px] sm:text-[16px] ${isSimplified ? '' : 'drop-shadow-cyan'}`}>account_tree</span>
              <span className="hidden sm:inline">{isSimplified ? 'Original' : 'Simplify'}</span>
            </button>
          )}

          {/* Resolve All button — only visible to group leader */}
          {!loading && balances && balances.length > 0 && currentUserIsLeader && (
            <button
              onClick={handleBulkSettle}
              disabled={bulkSettling}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg bg-gradient-to-b from-[#b224ef] to-[#7579ff] text-white shadow-[0_0_15px_rgba(178,36,239,0.4)] hover:shadow-[0_0_25px_rgba(178,36,239,0.6)] transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer border-none"
            >
              {bulkSettling ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                  <span className="hidden sm:inline">Settling...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px]">done_all</span>
                  <span className="hidden sm:inline">Resolve All</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {loading ? (
           <div className="flex justify-center py-8">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-app-red"></div>
           </div>
        ) : error ? (
           <div className="text-app-red text-sm bg-app-red/10 p-3 rounded-xl border border-app-red/20">{error}</div>
        ) : !balances || balances.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-center h-full text-slate-500">
             <span className="material-symbols-outlined text-3xl mb-2">check_circle</span>
             <p>You're all settled up!</p>
             <p className="text-xs mt-1">No outstanding balances in this group.</p>
           </div>
        ) : (
          <div className="space-y-3">
            {balances.map((debt: any, idx: number) => {
              const isSettling = settlingIdx === idx;
              const canSettle = currentUserIsLeader || isUserDebtor(debt);

              return (
                <div key={idx} className={`flex items-center justify-between p-4 bg-slate-800/40 light:bg-slate-50 border border-slate-700/50 light:border-slate-200 rounded-xl hover:bg-slate-800 light:hover:bg-slate-100 transition-colors ${isSettling ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-bold text-white light:text-slate-900 tracking-tight truncate max-w-[60px] sm:max-w-[70px]">{debt.fromUser?.userName || getUserName(debt.from)}</span>
                    
                    <div className="flex flex-col items-center justify-center text-app-red/60 px-0.5 sm:px-1 shrink-0">
                      <span className="material-symbols-outlined text-[14px] sm:text-[18px]">arrow_right_alt</span>
                    </div>

                    <span className="text-xs sm:text-sm font-bold text-white light:text-slate-900 tracking-tight truncate max-w-[60px] sm:max-w-[70px]">{debt.toUser?.userName || getUserName(debt.to)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="text-sm sm:text-base font-black text-app-red">₹{Number(debt.amount).toFixed(0)}</span>
                    
                    {/* Individual Settle button */}
                    {canSettle && (
                      <button
                        onClick={() => onOpenSettle?.((debt.toUser?._id || debt.to).toString(), Number(debt.amount).toFixed(2))}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-bold rounded-md bg-app-purple/20 text-app-purple hover:bg-app-purple/30 transition-colors cursor-pointer"
                        title="Settle this debt"
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        <span className="hidden sm:inline">Settle</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
