"use client";
import React, { useState, useEffect } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#00f2fe', '#a82ee2', '#ec5b13', '#eab308', '#22c55e', '#06b6d4', '#f43f5e', '#8b5cf6'];

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

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.4}
        className="transition-all duration-200"
        style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
      />
      {width > 60 && height > 45 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="white"
            fontSize={width > 120 ? 13 : 11}
            fontWeight="bold"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 12}
            textAnchor="middle"
            fill={balance >= 0 ? '#00f2fe' : '#a82ee2'}
            fontSize={width > 120 ? 12 : 10}
            fontWeight="600"
          >
            {balance >= 0 ? '+' : ''}&#8377;{(balance || 0).toFixed(0)}
          </text>
        </>
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
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-sm z-50">
          <p className="text-white font-bold">{d?.name || 'Group'}</p>
          <p className={balance >= 0 ? 'text-[#00f2fe]' : 'text-[#a82ee2]'}>
            {balance >= 0 ? 'You get back' : 'You owe'}: &#8377;{Math.abs(balance || 0).toFixed(0)}
          </p>
          <p className="text-slate-500 text-xs mt-1">Total moved: &#8377;{(size || 0).toFixed(0)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Group Heatmap</h2>
          <p className="text-xs text-slate-500 mt-0.5">Bigger box = more money moved</p>
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
