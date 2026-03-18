"use client";
import React, { useState, useEffect } from 'react';

interface ActivityFeedCardProps {
  groupId: string;
  refreshTrigger?: number;
  onRefresh?: () => void;
}

export default function ActivityFeedCard({ groupId, refreshTrigger = 0, onRefresh }: ActivityFeedCardProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    <div className="bg-app-card border border-app-border rounded-2xl flex flex-col h-[400px] overflow-hidden">
      <div className="p-5 border-b border-app-border bg-slate-900/50 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
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
              
              return (
                <div key={item._id || idx} className="group flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-colors">
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 mt-0.5 ${isSettle ? 'bg-app-purple/20 text-app-purple' : 'bg-app-cyan/20 text-app-cyan'}`}>
                     <span className="material-symbols-outlined text-[18px]">{isSettle ? 'payments' : 'receipt'}</span>
                  </div>
                  
                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${isDeleting ? 'opacity-50' : ''}`}>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                    <span className="text-xs text-slate-500 mt-1 block">{date}</span>
                  </div>

                  {/* Delete button */}
                  {item._id && (
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-500 hover:text-app-red cursor-pointer shrink-0 mt-1"
                      title="Delete"
                    >
                      {isDeleting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-app-red"></div>
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      )}
                    </button>
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
