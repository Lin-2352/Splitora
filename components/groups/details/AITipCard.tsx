"use client";
import React, { useState, useEffect } from "react";

interface AITipCardProps {
  groupId: string;
  refreshTrigger?: number;
}

export default function AITipCard({ groupId, refreshTrigger }: AITipCardProps) {
  const [tip, setTip] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTip = async () => {
      setLoading(true);
      setError(false);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/${groupId}/recommendations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTip(data.tip || "No insights available yet.");
      } catch {
        setError(true);
        setTip("Could not load AI insights right now.");
      } finally {
        setLoading(false);
      }
    };
    fetchTip();
  }, [groupId, refreshTrigger]);

  // Determine the icon & accent based on the tip content
  const isWarning = tip.includes("[WARNING]");
  const isBudgetOver = tip.includes("[BUDGET]");
  const isOk = tip.includes("[OK]");

  const getAccent = () => {
    if (isWarning) return { gradient: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30", icon: "warning", iconColor: "text-amber-400", glowColor: "shadow-[0_0_20px_rgba(245,158,11,0.15)]" };
    if (isBudgetOver) return { gradient: "from-rose-500/20 to-red-500/20", border: "border-rose-500/30", icon: "trending_up", iconColor: "text-rose-400", glowColor: "shadow-[0_0_20px_rgba(244,63,94,0.15)]" };
    if (isOk) return { gradient: "from-emerald-500/20 to-green-500/20", border: "border-emerald-500/30", icon: "check_circle", iconColor: "text-emerald-400", glowColor: "shadow-[0_0_20px_rgba(16,185,129,0.15)]" };
    return { gradient: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/30", icon: "lightbulb", iconColor: "text-violet-400", glowColor: "shadow-[0_0_20px_rgba(139,92,246,0.15)]" };
  };

  const accent = getAccent();

  // Clean tip text — remove prefix tags like [WARNING], [BUDGET], [OK]
  const cleanTip = tip.replace(/\[(WARNING|BUDGET|OK)\]\s*/g, "");

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border ${accent.border}
        bg-gradient-to-br ${accent.gradient}
        backdrop-blur-xl ${accent.glowColor}
        p-5 transition-all duration-500
        light:bg-white/80 light:backdrop-blur-sm
      `}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #a855f7 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${accent.gradient} ${accent.border} border`}>
          <span className={`material-symbols-outlined text-[20px] ${accent.iconColor}`}>
            {loading ? "hourglass_top" : accent.icon}
          </span>
        </div>
        <div>
          <h3 className="text-sm font-black text-white light:text-slate-900 tracking-tight">
            AI Insight
          </h3>
        </div>

        {/* Sparkle decoration */}
        <div className="ml-auto">
          <span className={`material-symbols-outlined text-[16px] ${accent.iconColor} opacity-50 animate-pulse`}>
            auto_awesome
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {loading ? (
          <div className="space-y-2.5">
            <div className="h-3 bg-white/5 light:bg-slate-200 rounded-full w-full animate-pulse" />
            <div className="h-3 bg-white/5 light:bg-slate-200 rounded-full w-4/5 animate-pulse" style={{ animationDelay: "150ms" }} />
            <div className="h-3 bg-white/5 light:bg-slate-200 rounded-full w-3/5 animate-pulse" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <p className={`text-sm leading-relaxed font-medium ${error ? "text-slate-500 italic" : "text-slate-300 light:text-slate-600"}`}>
            {cleanTip}
          </p>
        )}
      </div>
    </div>
  );
}
