"use client";
import React, { useState, useEffect } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  '#00f2fe', 
  '#a82ee2', 
  '#ec5b13', 
  '#22c55e', 
  '#06b6d4', 
  '#f43f5e', 
  '#8b5cf6'
];

interface TreemapItem {
  [key: string]: unknown;
  name: string;
  size: number;
  balance: number;
  color: string;
  children?: TreemapItem[];
}

const toSafeNumber = (value: unknown, fallback = 0): number => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

// Custom content renderer for treemap cells
const CustomContent = (props: any) => {
  const { x, y, width, height, name, color } = props;
  const balance = toSafeNumber(props.balance ?? props.payload?.balance ?? props.root?.balance);
  if (width < 30 || height < 30) return null;

  const showName = width > 50 && height > 35;
  const showBalance = width > 50 && height > 55 && Math.round(Math.abs(balance)) > 0;
  const fontSize = width > 200 ? 15 : width > 120 ? 13 : 11;
  
  // Calculate max characters that fit based on actual width (approx 0.6em per char)
  const charWidth = fontSize * 0.6;
  const maxChars = Math.floor((width - 20) / charWidth); // 20px total padding
  const displayName = name.length > maxChars && maxChars > 3 
    ? name.slice(0, maxChars - 1) + '…' 
    : name;

  // Detect light mode for text fill
  const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  const nameFill = isLight ? '#0f172a' : 'white';

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        rx={8}
        ry={8}
        fill={color}
        fillOpacity={isLight ? 0.18 : 0.12}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.5}
        style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
      />
      {showName && (
        <text
          x={x + width / 2}
          y={showBalance ? y + height / 2 - 8 : y + height / 2 + 3}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={nameFill}
          fontSize={fontSize}
          fontWeight="700"
          style={{ pointerEvents: 'none' }}
        >
          {displayName}
        </text>
      )}
      {showBalance && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={balance >= 0 ? '#00f2fe' : '#a82ee2'}
          fontSize={fontSize - 1}
          fontWeight="600"
          style={{ pointerEvents: 'none' }}
        >
          {balance >= 0 ? '+' : ''}&#8377;{Math.abs(Math.round(balance))}
        </text>
      )}
    </g>
  );
};

export default function GroupTreemap() {
  const [data, setData] = useState<TreemapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/user/dashboard/treemap', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (!res.ok) return;

        const groups = (result.groups || [])
          .map((g: any, i: number) => {
            const amount = toSafeNumber(g.amount);
            return {
              name: g.groupName || 'Group',
              size: Math.max(Math.abs(amount), 1), // Treemap needs positive sizes
              balance: amount,
              color: COLORS[i % COLORS.length]
            };
          })
          .sort((a: TreemapItem, b: TreemapItem) => b.size - a.size);

        setData(groups);
      } catch (err) {
        console.error('Treemap error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const TreemapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0]?.payload;
      const balance = toSafeNumber(d?.balance);
      const size = toSafeNumber(d?.size);
      return (
        <div className="bg-slate-900 light:bg-white border border-slate-700 light:border-slate-200 p-3 rounded-xl shadow-xl light:shadow-md text-sm z-50">
          <p className="text-white light:text-slate-900 font-bold tracking-tight">{d?.name || 'Group'}</p>
          <p className={balance >= 0 ? 'text-app-cyan' : 'text-app-purple'}>
            {balance >= 0 ? 'You get back' : 'You owe'}: &#8377;{Math.abs(balance || 0).toFixed(0)}
          </p>
          <p className="text-slate-500 text-xs mt-1">Total moved: &#8377;{(size || 0).toFixed(0)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/80 light:bg-white backdrop-blur-xl border border-slate-800 light:border-slate-200 rounded-3xl p-6 shadow-xl light:shadow-sm hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl light:hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white light:text-slate-900 tracking-tight">Group Heatmap</h2>
          <p className="text-xs text-slate-500 light:text-slate-500 mt-0.5">Bigger box = more money moved</p>
        </div>
        <span className="material-symbols-outlined text-[#ec5b13] text-[18px]">grid_view</span>
      </div>

      <div className="w-full min-h-[250px]">
        {loading ? (
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-app-cyan"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-slate-500">
            <span className="material-symbols-outlined text-3xl mb-2 opacity-50">grid_view</span>
            <p className="text-sm">No group data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <Treemap
              data={data}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="none"
              content={<CustomContent />}
            >
              <Tooltip content={<TreemapTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
