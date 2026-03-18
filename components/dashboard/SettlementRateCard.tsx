"use client";
import React, { useState, useEffect } from 'react';

export default function SettlementRateCard() {
  const [stats, setStats] = useState({ settled: 0, pending: 0, rate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Get all groups
        const groupsRes = await fetch('/api/getMyGroups', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const groupsData = await groupsRes.json();
        if (!groupsRes.ok) return;

        const groups = groupsData.groups || [];
        let totalDebts = 0;
        let settledDebts = 0;

        // For each group, check simplify-debt to see pending vs settled
        for (const group of groups.slice(0, 6)) {
          try {
            const res = await fetch(`/api/${group._id}/simplify-debt`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
              const debts = (data.simplifiedDebts || []).filter((d: any) => Math.abs(d.amount) >= 0.01);
              totalDebts += debts.length;
            }
          } catch {}
        }

        // Get activity to count settlements
        for (const group of groups.slice(0, 6)) {
          try {
            const res = await fetch(`/api/${group._id}/activity`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.activity) {
              settledDebts += data.activity.filter((a: any) => a.type === 'settlement').length;
            }
          } catch {}
        }

        const total = settledDebts + totalDebts;
        const rate = total > 0 ? (settledDebts / total) * 100 : 0;

        setStats({ settled: settledDebts, pending: totalDebts, rate: Math.round(rate) });
      } catch (err) {
        console.error('SettlementRate error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Gauge arc
  const radius = 40;
  const circumference = Math.PI * radius; // half-circle
  const offset = circumference - (stats.rate / 100) * circumference;
  const gaugeColor = stats.rate >= 70 ? '#00f2fe' : stats.rate >= 40 ? '#eab308' : '#a82ee2';

  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[18px]" style={{ color: gaugeColor }}>speed</span>
        <h3 className="text-sm font-bold text-white">Settlement Rate</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-app-cyan"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Semi-circle gauge */}
          <div className="relative w-[100px] h-[55px] mb-2">
            <svg width="100" height="55" viewBox="0 0 100 55" className="overflow-visible">
              {/* Background arc */}
              <path
                d="M 5 50 A 40 40 0 0 1 95 50"
                fill="none"
                stroke="#2a2e3f"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Filled arc */}
              <path
                d="M 5 50 A 40 40 0 0 1 95 50"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${offset}`}
                style={{ filter: `drop-shadow(0 0 6px ${gaugeColor})`, transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-end justify-center pb-0">
              <span className="text-xl font-bold text-white">{stats.rate}%</span>
            </div>
          </div>

          <div className="flex gap-6 mt-2 text-center">
            <div>
              <p className="text-lg font-bold text-[#00f2fe]">{stats.settled}</p>
              <p className="text-[10px] text-slate-500 uppercase">Settled</p>
            </div>
            <div>
              <p className="text-lg font-bold text-[#a82ee2]">{stats.pending}</p>
              <p className="text-[10px] text-slate-500 uppercase">Pending</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
