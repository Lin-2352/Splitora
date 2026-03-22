"use client"
import React, { useState, useEffect } from 'react';
import GroupCard from '@/components/groups/GroupCard';
import CreateGroupModal from '@/components/groups/CreateGroupModal';
import JoinGroupModal from '@/components/groups/JoinGroupModal';

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
      
      setGroups(data.groups || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Use the logged in user ID to determine role, for now we will check if role string is 'groupLeader'
  const getRole = (group: any) => {
    // getMyGroups currently returns a minimal list, we'd need the real user ID vs member list.
    // For now we assume the backend structure returns a format we can parse. 
    // Assuming backend returns groups based on member array.
    // Let's deduce role if possible, or default to member.
    return 'member'; // We will update this logic when we see the exact getMyGroups response
  };

  return (
    <>
          
          {/* Header */}
          <header className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white mb-1">My Groups</h2>
              <p className="text-slate-400">Manage your shared expenses and circles</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-app-purple to-[#c43add] hover:opacity-90 text-white font-bold text-sm shadow-glow-purple transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Create Group
              </button>
              <button 
                onClick={() => setIsJoinModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-app-cyan to-[#00d2dd] hover:opacity-90 text-slate-900 font-bold text-sm shadow-glow-cyan transition-all"
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
              <div className="text-center py-20 px-4 bg-app-card border border-slate-800 rounded-2xl">
                 <span className="material-symbols-outlined text-4xl text-slate-600 mb-4">group_off</span>
                 <h3 className="text-xl font-bold text-white mb-2">No Groups Yet</h3>
                 <p className="text-slate-400 max-w-sm mx-auto mb-6">You aren't a member of any groups. Create a new group or join an existing one to start splitting expenses.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groups.map((group) => (
                  <GroupCard 
                    key={group._id}
                    id={group._id}
                    name={group.groupName}
                    role={group.currentUserRole || 'member'} 
                    memberCount={group.members?.length || 0}
                    inviteCode={group.inviteCode}
                  />
                ))}
              </div>
            )}
          </section>


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
