"use client";
import React, { useState, useEffect } from 'react';

interface BalancesCardProps {
  groupId: string;
  refreshTrigger?: number;
  onRefresh?: () => void;
  members?: any[];
  currentUserIsLeader?: boolean;
  currentUserId?: string;
}

export default function BalancesCard({ groupId, refreshTrigger = 0, onRefresh, members = [], currentUserIsLeader = false, currentUserId = '' }: BalancesCardProps) {
  const [balances, setBalances] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulkSettling, setBulkSettling] = useState(false);
  const [settlingIdx, setSettlingIdx] = useState<number | null>(null);

  const getUserName = (userId: string) => {
    const member = members.find((m: any) => {
      const id = m.user?._id || m.user;
      return id?.toString() === userId?.toString();
    });
    return member?.user?.userName || member?.user?.name || member?.user?.email || 'Unknown';
  };

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/${groupId}/simplify-debt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch balances');
      
      // Filter out zero-amount debts (floating point rounding artifacts)
      const debts = (data.simplifiedDebts || []).filter((d: any) => Math.abs(d.amount) >= 0.01);
      setBalances(debts);
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

  // Check if current user is the creditor (the person who is owed money / expense creator)
  const isUserCreditor = (debt: any) => {
    const toId = (debt.toUser?._id || debt.to)?.toString();
    return toId === currentUserId;
  };

  return (
    <div className="bg-app-card border border-app-border rounded-2xl flex flex-col h-[400px] overflow-hidden">
      <div className="p-5 border-b border-app-border bg-slate-900/50 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-app-red">account_balance_wallet</span>
          Group Balances
        </h3>
        {/* Resolve All button — only visible to group leader */}
        {!loading && balances && balances.length > 0 && currentUserIsLeader && (
          <button
            onClick={handleBulkSettle}
            disabled={bulkSettling}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-app-purple to-app-cyan text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {bulkSettling ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                Settling...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                Resolve All
              </>
            )}
          </button>
        )}
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
              const canSettle = currentUserIsLeader || isUserCreditor(debt);

              return (
                <div key={idx} className={`flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-colors ${isSettling ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-bold text-white truncate max-w-[70px]">{debt.fromUser?.userName || getUserName(debt.from)}</span>
                    
                    <div className="flex flex-col items-center justify-center text-slate-500 px-1 text-xs shrink-0">
                      <span className="inline-block w-6 border-b-2 border-dashed border-app-red mb-0.5 relative before:absolute before:-right-1 before:-top-1.5 before:content-['▶'] before:text-[8px] before:text-app-red"></span>
                      <span className="text-[10px]">owes</span>
                    </div>

                    <span className="text-sm font-bold text-white truncate max-w-[70px]">{debt.toUser?.userName || getUserName(debt.to)}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-base font-black text-app-red">₹{Number(debt.amount).toFixed(0)}</span>
                    
                    {/* Individual Settle button */}
                    {canSettle && (
                      <button
                        onClick={() => handleIndividualSettle(debt, idx)}
                        disabled={isSettling}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md bg-app-purple/20 text-app-purple hover:bg-app-purple/30 transition-colors cursor-pointer disabled:opacity-50"
                        title="Settle this debt"
                      >
                        {isSettling ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-app-purple"></div>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Settle
                          </>
                        )}
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
