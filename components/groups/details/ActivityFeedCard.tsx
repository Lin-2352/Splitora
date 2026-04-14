"use client";
import React, { useState, useEffect } from 'react';
import { useInView } from '@/hooks/useInView';

interface ActivityFeedCardProps {
  groupId: string;
  refreshTrigger?: number;
  onRefresh?: () => void;
  className?: string;
}

export default function ActivityFeedCard({ groupId, refreshTrigger = 0, onRefresh, className = 'h-[400px]' }: ActivityFeedCardProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { ref: listRef, inView: listInView } = useInView({ threshold: 0.1 });

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/${groupId}/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch activity');
      
      // The backend returns { activity: [...] } with pre-formatted description strings
      const feed = data.activity || data.feed || [];
      setActivities(feed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchActivity();
  }, [groupId, refreshTrigger]);

  const handleDelete = async (item: any) => {
    const isSettle = item.type === 'settlement';
    const confirmMsg = isSettle
      ? `Delete this settlement?`
      : `Delete this expense?`;

    if (!confirm(confirmMsg)) return;

    // Only attempt delete if we have an _id
    if (!item._id) {
      alert('Cannot delete: item has no ID');
      return;
    }

    try {
      setDeletingId(item._id);
      const token = localStorage.getItem('token');

      const url = isSettle
        ? `/api/${groupId}/deleteSettlement/${item._id}`
        : `/api/${groupId}/deleteTransactions/${item._id}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      // Remove from local state for instant feedback
      setActivities(prev => prev.filter(a => a._id !== item._id));
      // Trigger parent refresh for balances
      onRefresh?.();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div ref={listRef} className={`relative bg-slate-900/60 light:bg-white/80 backdrop-blur-2xl border border-slate-800/60 light:border-slate-200 shadow-2xl light:shadow-lg rounded-3xl flex flex-col overflow-hidden group hover:border-slate-700/80 transition-all duration-500 ${className}`}>
      {/* Top Edge Neon String */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-app-cyan to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="p-5 border-b border-slate-800/50 light:border-slate-200 bg-slate-800/20 light:bg-slate-50/50 flex justify-between items-center relative z-10">
        <h3 className="font-bold text-white light:text-slate-900 tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-app-cyan">history</span>
          Recent Activity
        </h3>
        <span className="text-xs text-slate-500">{activities.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {loading ? (
           <div className="flex justify-center py-8">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-app-cyan"></div>
           </div>
        ) : error ? (
           <div className="text-app-red text-sm bg-app-red/10 p-3 rounded-xl border border-app-red/20">{error}</div>
        ) : activities.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-center h-full text-slate-500">
             <span className="material-symbols-outlined text-3xl mb-2">receipt_long</span>
             <p>No activity yet.</p>
             <p className="text-xs mt-1">Add an expense to get started.</p>
           </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item: any, idx: number) => {
              const isSettle = item.type === 'settlement';
              const date = new Date(item.createdAt || item.settleAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
              const isDeleting = deletingId === item._id;
              const hasBillItems = item.billItems && item.billItems.length > 0;
              const isExpanded = expandedId === item._id;
              
              return (
                <div
                  key={item._id || idx}
                  className={`group rounded-2xl border border-slate-700/50 light:border-slate-200 overflow-hidden transition-all duration-300 ${listInView ? 'animate-slide-left' : 'opacity-0'} ${isExpanded ? 'bg-slate-800/60 light:bg-slate-50 border-slate-600/60 light:border-slate-300' : 'bg-slate-800/40 light:bg-slate-50 hover:bg-slate-800 light:hover:bg-slate-100'}`}
                  style={listInView ? { animationDelay: `${idx * 60}ms` } : undefined}
                >
                  {/* Main Row */}
                  <div
                    className={`flex flex-row items-center gap-4 p-3.5 ${hasBillItems ? 'cursor-pointer' : ''}`}
                    onClick={() => hasBillItems && setExpandedId(isExpanded ? null : item._id)}
                  >
                    {/* Icon */}
                    <div className={`flex items-center justify-center shrink-0 w-10 h-10 rounded-full text-white ${isSettle ? 'bg-gradient-to-br from-[#a82ee2] to-[#7e22ce] shadow-[0_0_15px_rgba(168,46,226,0.3)]' : 'bg-gradient-to-br from-[#00f2fe] to-[#4facfe] shadow-[0_0_15px_rgba(0,242,254,0.3)]'}`}>
                       <span className={`material-symbols-outlined text-[20px] ${listInView ? 'animate-icon-wiggle' : ''}`} style={{ animationDelay: `${idx * 60 + 150}ms` }}>{isSettle ? 'payments' : 'receipt'}</span>
                    </div>
                    
                    {/* Content */}
                    <div className={`flex flex-col flex-1 min-w-0 ${isDeleting ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-300 light:text-slate-800 font-bold truncate">
                          {item.description}
                        </p>
                        {hasBillItems && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                            <span className="material-symbols-outlined text-emerald-400 text-[11px]">document_scanner</span>
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">{item.billItems.length}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-500 light:text-slate-400 mt-0.5">{date}</span>
                    </div>

                    {/* Expand chevron for bill items */}
                    {hasBillItems && (
                      <span className={`material-symbols-outlined text-[18px] text-slate-500 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    )}

                    {/* Delete button */}
                    {item._id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                        disabled={isDeleting}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-500 hover:text-app-red cursor-pointer shrink-0"
                        title="Delete"
                      >
                        {isDeleting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-app-red"></div>
                        ) : (
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Expandable Items Panel */}
                  {hasBillItems && isExpanded && (
                    <div className="border-t border-slate-700/30 light:border-slate-200/80 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="divide-y divide-slate-700/20 light:divide-slate-200/60">
                        {item.billItems.map((bi: any, biIdx: number) => (
                          <div key={biIdx} className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-700/20 light:hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-700/60 light:bg-slate-200 text-[10px] font-black text-slate-400 light:text-slate-500 shrink-0">
                                {biIdx + 1}
                              </span>
                              <span className="text-xs font-semibold text-slate-400 light:text-slate-600 truncate">{bi.name}</span>
                            </div>
                            <span className="text-xs font-black text-emerald-400 light:text-emerald-600 tabular-nums shrink-0 ml-2">
                              ₹{(bi.price || bi.total || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-2 bg-slate-800/40 light:bg-slate-100/60 border-t border-slate-700/20 light:border-slate-200/60 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scanned Total</span>
                        <span className="text-xs font-black text-white light:text-slate-900 tabular-nums">
                          ₹{item.billItems.reduce((s: number, bi: any) => s + (bi.price || bi.total || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
