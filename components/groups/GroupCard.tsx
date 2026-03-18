import React from 'react';
import Link from 'next/link';

interface GroupCardProps {
  id: string;
  name: string;
  role: 'groupLeader' | 'member';
  memberCount: number;
  inviteCode: string;
}

export default function GroupCard({ id, name, role, memberCount, inviteCode }: GroupCardProps) {
  const isLeader = role === 'groupLeader';
  const themeColor = isLeader ? 'app-purple' : 'app-cyan';

  return (
    <Link href={`/dashboard/groups/${id}`} className="block">
      <div className={`bg-app-card border border-app-border rounded-2xl p-5 relative group cursor-pointer transition-all hover:border-${themeColor} hover:shadow-glow-${themeColor.replace('app-', '')} h-full flex flex-col`}>
        {/* Role Badge */}
        <div className={`absolute top-4 right-4 bg-${themeColor}/20 text-${themeColor} text-[10px] font-bold uppercase px-2 py-1 rounded-md border border-${themeColor}/30`}>
          {isLeader ? 'Leader' : 'Member'}
        </div>

        {/* Icon */}
      <div className={`size-12 rounded-xl bg-${themeColor}/10 flex items-center justify-center mb-4`}>
        <span className={`material-symbols-outlined text-${themeColor}`}>
          {isLeader ? 'flight_takeoff' : 'home'}
        </span>
      </div>

      <h3 className="text-xl font-bold mb-1 text-white">{name}</h3>

      {/* Members Preview */}
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
        <div className="flex -space-x-2">
          {/* Mock Avatars */}
          <div className="size-6 rounded-full border-2 border-app-card bg-slate-600"></div>
          <div className="size-6 rounded-full border-2 border-app-card bg-slate-500"></div>
          <div className="size-6 rounded-full border-2 border-app-card bg-slate-400"></div>
          {memberCount > 3 && (
            <div className={`size-6 rounded-full border-2 border-app-card bg-${themeColor} flex items-center justify-center text-[8px] font-bold text-white`}>
              +{memberCount - 3}
            </div>
          )}
        </div>
        <span>{memberCount} Members</span>
      </div>

      {/* Invite Code */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/50" onClick={(e) => e.stopPropagation()}>
        <code className="text-xs font-mono text-slate-300">{inviteCode}</code>
        <button 
          className="text-slate-400 hover:text-white transition-colors"
          onClick={() => navigator.clipboard.writeText(inviteCode)}
          title="Copy code"
        >
          <span className="material-symbols-outlined text-[18px]">content_copy</span>
        </button>
      </div>
      </div>
    </Link>
  );
}
