"use client";
import React, { useState, useEffect } from 'react';
import { useInView } from '@/hooks/useInView';

export default function BalanceCard() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch all groups
        const groupsRes = await fetch('/api/getMyGroups', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const groupsData = await groupsRes.json();
        if (!groupsRes.ok) return;

        const groups = groupsData.groups || [];
        const allActivity: any[] = [];

        // Fetch activity from each group
        for (const group of groups.slice(0, 5)) {
          try {
            const res = await fetch(`/api/${group._id}/activity`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.activity) {
              data.activity.forEach((item: any) => {
                allActivity.push({ ...item, groupName: group.groupName });
              });
            }
          } catch {}
        }

        // Sort by date, take latest 6
        allActivity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setActivities(allActivity.slice(0, 6));
      } catch (err) {
        console.error('Activity fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <div ref={ref} className="bg-slate-900/80 light:bg-white backdrop-blur-xl border border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-xl light:shadow-sm flex flex-col h-full transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white light:text-slate-900 flex items-center gap-2 tracking-tight">
          <span className={`material-symbols-outlined text-app-cyan text-[20px] ${inView ? 'animate-icon-pop' : 'opacity-0'}`} style={{ animationDelay: '150ms' }}>timeline</span>
          Recent Activity
        </h2>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-app-cyan"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <span className="material-symbols-outlined text-2xl mb-2 opacity-50">history</span>
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <ul className="space-y-1 flex-1">
          {activities.map((activity, idx) => {
            const isSettle = activity.type === 'settlement';
            return (
              <li
                key={idx}
                className={`flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/40 light:hover:bg-slate-100 transition-colors ${inView ? 'animate-slide-left' : 'opacity-0'}`}
                style={inView ? { animationDelay: `${idx * 80}ms` } : undefined}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-white ${
                  isSettle 
                    ? 'bg-gradient-to-br from-[#a82ee2] to-[#7e22ce] shadow-[0_0_8px_rgba(168,46,226,0.3)]' 
                    : 'bg-gradient-to-br from-[#00f2fe] to-[#4facfe] shadow-[0_0_8px_rgba(0,242,254,0.3)]'
                }`}>
                  <span className={`material-symbols-outlined text-[15px] ${inView ? 'animate-icon-wiggle' : ''}`} style={{ animationDelay: `${idx * 80 + 200}ms` }}>
                    {isSettle ? 'payments' : 'receipt_long'}
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-300 light:text-slate-700 font-medium leading-relaxed truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">{getTimeAgo(activity.createdAt)}</span>
                    <span className="text-[10px] text-slate-500 font-medium truncate">{activity.groupName}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
