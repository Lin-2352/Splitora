"use client";
import React, { useState, useEffect } from 'react';
import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';

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

  const { ref, inView } = useInView({ threshold: 0.2 });
  const animatedRate = useCountUp(stats.rate, inView && !loading, 2200);
  const animatedSettled = useCountUp(stats.settled, inView && !loading, 1800);
  const animatedPending = useCountUp(stats.pending, inView && !loading, 1800);

  // Gauge arc
  const radius = 45;
  const circumference = Math.PI * radius; // half-circle
  // Always use direct hex values in SVG — CSS vars don't resolve in SVG stroke attributes
  const gaugeColor = stats.rate >= 70 ? '#00f2fe' : stats.rate >= 40 ? '#22c55e' : '#a82ee2';
  const glowColor = stats.rate >= 70 ? 'rgba(0,242,254,0.4)' : stats.rate >= 40 ? 'rgba(34,197,94,0.4)' : 'rgba(168,46,226,0.4)';
  const offset = circumference * (1 - stats.rate / 100);

  return (
    <div ref={ref} className={`bg-slate-900/80 light:bg-white backdrop-blur-xl border border-slate-800 light:border-slate-200 rounded-3xl p-5 shadow-xl light:shadow-sm relative overflow-hidden transition-all duration-300 ${inView && !loading ? 'animate-pulse-glow' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`material-symbols-outlined text-[18px] ${inView ? 'animate-icon-pop' : 'opacity-0'}`} style={{ color: gaugeColor, animationDelay: '200ms' }}>speed</span>
        <h3 className="text-sm font-bold text-white light:text-slate-900 tracking-tight">Settlement Rate</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-app-cyan"></div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Semi-circle gauge */}
          <div className="relative w-[120px] h-[70px] mb-3">
            <svg width="120" height="70" viewBox="0 0 120 65" className="overflow-visible">
              <defs>
                <filter id="gauge-glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Background arc */}
              <path
                d="M 8 58 A 52 52 0 0 1 112 58"
                fill="none"
                stroke="#1e293b"
                strokeWidth="9"
                strokeLinecap="round"
              />
              {/* Colored filled arc */}
              <path
                d="M 8 58 A 52 52 0 0 1 112 58"
                fill="none"
                stroke={gaugeColor}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${Math.PI * 52}`}
                strokeDashoffset={`${Math.PI * 52 * (1 - stats.rate / 100)}`}
                style={{ 
                  filter: `drop-shadow(0 0 6px ${gaugeColor})`,
                  transition: 'stroke-dashoffset 1s ease'
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-end justify-center pb-1">
              <span className="text-xl font-black" style={{ color: gaugeColor }}>{animatedRate}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ 
                width: `${stats.rate}%`,
                background: `linear-gradient(to right, ${gaugeColor}99, ${gaugeColor})`,
                boxShadow: `0 0 8px ${glowColor}`
              }}
            />
          </div>

          <div className="flex gap-6 mt-2 text-center">
            <div>
              <p className="text-lg font-bold text-app-cyan">{animatedSettled}</p>
              <p className="text-[10px] text-slate-500 uppercase">Settled</p>
            </div>
            <div>
              <p className="text-lg font-bold text-app-purple">{animatedPending}</p>
              <p className="text-[10px] text-slate-500 uppercase">Pending</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
