"use client"
import React, { useState, useEffect } from 'react';
import GroupCard from '@/components/groups/GroupCard';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import JoinGroupModal from '@/components/groups/JoinGroupModal';
import AnimatedCard from '@/components/AnimatedCard';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/getMyGroups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch groups');
      
      let userId = '';
      if (token) {
        try {
          userId = JSON.parse(atob(token.split('.')[1])).userId;
        } catch(e) {}
      }

      const sortedGroups = (data.groups || [])
        .map((g: any) => {
           let role = 'member';
           const me = g.members?.find((m: any) => (m.user?._id === userId || m.user === userId));
           if (me && me.role === 'groupLeader') role = 'groupLeader';
           return { ...g, currentUserRole: role };
        })
        .sort((a: any, b: any) => 
        (a.groupName || '').localeCompare(b.groupName || '')
      );
      setGroups(sortedGroups);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const getRole = (group: any) => {
    return group.currentUserRole || 'member';
  };

  return (
    <>
      {/* Background Dots */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] light:opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

      <div className="flex-1 overflow-y-auto w-full relative z-10">
          
          {/* Header */}
          <header className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white light:text-slate-900 mb-1">My Groups</h2>
              <p className="text-sm font-medium text-slate-400 light:text-slate-500">Manage your shared expenses and circles</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-b from-[#00f2fe] to-[#4facfe] text-slate-900 font-bold text-sm shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_25px_rgba(0,242,254,0.5)] transition-all hover:-translate-y-1"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Create Group
              </button>
              <button 
                onClick={() => setIsJoinModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-b from-[#b224ef] to-[#7579ff] text-white font-bold text-sm shadow-[0_0_15px_rgba(178,36,239,0.3)] hover:shadow-[0_0_25px_rgba(178,36,239,0.5)] transition-all hover:-translate-y-1"
              >
                <span className="material-symbols-outlined text-[20px]">group_add</span>
                Join Group
              </button>
            </div>
          </header>

          {/* Group Grid */}
          <section className="px-6 md:px-8 pb-12">
            {error ? (
              <div className="bg-app-red/10 border border-app-red/20 text-app-red p-4 rounded-xl">
                {error}
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-app-cyan"></div>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                {/* Glowing Background Ring */}
                <div className="relative mb-8">
                   <div className="absolute inset-0 bg-[#00f2fe] light:bg-[#7e22ce] blur-[60px] opacity-20 light:opacity-30 rounded-full"></div>
                   <div className="relative bg-slate-900/50 light:bg-slate-100/50 backdrop-blur-xl border border-slate-700/50 light:border-slate-300 shadow-2xl p-6 rounded-3xl transform transition-transform hover:scale-105 duration-500">
                     <span className="material-symbols-outlined text-[64px] text-[#00f2fe] light:text-[#7e22ce] drop-shadow-cyan light:drop-shadow-purple">
                       hub
                     </span>
                   </div>
                </div>
                
                <h3 className="text-3xl font-black text-white light:text-slate-900 tracking-tight mb-4">You're Not in any Groups!</h3>
                <p className="text-slate-400 light:text-slate-500 max-w-md mx-auto mb-8 text-lg">
                  Connections start here. Create a brand new group or enter an invite code to join your friends.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full justify-center">
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex justify-center flex-1 sm:flex-none items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-b from-[#00f2fe] to-[#4facfe] text-slate-900 font-bold text-sm shadow-[0_0_25px_rgba(0,242,254,0.3)] hover:shadow-[0_0_35px_rgba(0,242,254,0.5)] transition-all hover:-translate-y-1 hover:brightness-110"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    Create Group
                  </button>
                  <button 
                    onClick={() => setIsJoinModalOpen(true)}
                    className="flex justify-center flex-1 sm:flex-none items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-b from-[#b224ef] to-[#7579ff] text-white font-bold text-sm shadow-[0_0_25px_rgba(178,36,239,0.3)] hover:shadow-[0_0_35px_rgba(178,36,239,0.5)] transition-all hover:-translate-y-1 hover:brightness-110"
                  >
                    <span className="material-symbols-outlined text-[20px]">group_add</span>
                    Join Group
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groups.map((group, idx) => (
                  <AnimatedCard
                    key={group._id}
                    delay={idx * 80}
                  >
                    <GroupCard 
                      id={group._id}
                      name={group.groupName}
                      role={group.currentUserRole || 'member'} 
                      memberCount={group.members?.length || 0}
                      inviteCode={group.inviteCode}
                      onRefresh={fetchGroups}
                    />
                  </AnimatedCard>
                ))}
              </div>
            )}
          </section>

        </div>

      {/* Modals */}
      <CreateGroupModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchGroups} 
      />
      
      <JoinGroupModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        onSuccess={fetchGroups} 
      />
    </>
  );
}
