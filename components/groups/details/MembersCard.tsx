"use client";
import React, { useState } from 'react';

interface MembersCardProps {
  groupId: string;
  members: any[];
  currentUserIsLeader: boolean;
  onRefresh: () => void;
}

export default function MembersCard({ groupId, members, currentUserIsLeader, onRefresh }: MembersCardProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this group?`)) return;

    try {
      setActionLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/removeMembers`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ groupId, memberIds: [memberId] })
      });
      
      if (!res.ok) throw new Error('Failed to remove member');
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-app-card border border-app-border rounded-2xl flex flex-col h-[400px] overflow-hidden">
      <div className="p-5 border-b border-app-border bg-slate-900/50 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-app-purple">group</span>
          Group Members
        </h3>
        <span className="bg-app-bg text-slate-400 text-xs font-bold px-2 py-1 rounded-md border border-app-border">
          {members.length} Total
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

        {members.map((member: any) => {
          const isMemberLeader = member.role === 'groupLeader';
          const userName = member.user?.userName || member.user?.name || member.user?.email || 'Unknown User';
          const userId = member.user?._id || member.user;

          return (
            <div key={userId} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <img 
                  src={`https://api.dicebear.com/9.x/lorelei/svg?seed=${userName}`}
                  alt={`${userName} Avatar`}
                  className={`size-10 rounded-full object-cover border-2 ${isMemberLeader ? 'border-app-purple' : 'border-slate-700 bg-slate-800'}`}
                />
                <div>
                  <p className="text-sm font-bold text-white">{userName}</p>
                  <p className="text-xs text-slate-400">{isMemberLeader ? 'Group Leader' : 'Member'}</p>
                </div>
              </div>

              {isMemberLeader ? (
                <span className="text-[10px] font-bold text-app-purple bg-app-purple/10 px-2 py-1 rounded-md border border-app-purple/20">
                  OWNER
                </span>
              ) : (
                currentUserIsLeader && (
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleRemoveMember(userId, userName)}
                    className="text-slate-500 hover:text-app-red transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100" 
                    title="Remove Member"
                  >
                    <span className="material-symbols-outlined">person_remove</span>
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
